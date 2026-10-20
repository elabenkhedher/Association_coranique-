import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../providers/presence_provider.dart';
import '../providers/navigation_provider.dart';
import 'presences_screen.dart';

class PlanningScreen extends StatefulWidget {
  const PlanningScreen({super.key});

  @override
  State<PlanningScreen> createState() => _PlanningScreenState();
}

class _PlanningScreenState extends State<PlanningScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _apiService = ApiService();
  
  List<dynamic> _allCreneaux = [];
  bool _isLoading = true;
  String _userRole = 'enseignant';

  final List<String> _days = [
    'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 7, vsync: this);
    int initialDay = DateTime.now().weekday - 1;
    _tabController.index = initialDay;
    _fetchPlanning();
  }

  Future<void> _fetchPlanning() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('user_id') ?? 0;
      final role = prefs.getString('role') ?? 'enseignant';
      
      final data = (role == 'apprenant') 
          ? await _apiService.getPlanningApprenant(userId)
          : await _apiService.getPlanningEnseignant(userId);
          
      debugPrint("API Response pour rôle $role (ID: $userId): $data");
          
      setState(() {
        _allCreneaux = data;
        _userRole = role;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error fetching planning: $e");
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Erreur lors du chargement du planning")),
        );
      }
    }
  }

  List<dynamic> _getCreneauxForDay(int dayIndex) {
    return _allCreneaux.where((c) {
      if (c['date'] == null) return false;
      DateTime date = DateTime.parse(c['date']);
      return (date.weekday - 1) == dayIndex;
    }).toList();
  }

  void _showAddSlotDialog() {
    showDialog(
      context: context,
      builder: (context) => const AddSlotDialog(),
    ).then((value) {
      if (value == true) _fetchPlanning();
    });
  }

  @override
  Widget build(BuildContext context) {
    bool isEnseignant = _userRole == 'enseignant';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF8),
      appBar: AppBar(
        title: const Text("Mon Planning", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF171717),
        elevation: 0,
        centerTitle: true,
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.grey.shade600,
              indicator: BoxDecoration(
                color: const Color(0xFF008C45),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(color: const Color(0xFF008C45).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4)),
                ],
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              indicatorPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              labelPadding: const EdgeInsets.symmetric(horizontal: 24),
              tabs: _days.map((day) => Tab(text: day)).toList(),
            ),
          ),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator(color: Color(0xFF008C45)))
              : TabBarView(
                  controller: _tabController,
                  children: List.generate(7, (index) {
                    final dayCreneaux = _getCreneauxForDay(index);
                    if (dayCreneaux.isEmpty) {
                      return RefreshIndicator(
                        color: const Color(0xFF008C45),
                        onRefresh: _fetchPlanning,
                        child: ListView(
                          children: [
                            const SizedBox(height: 100),
                            Center(
                              child: Column(
                                children: [
                                  Icon(Icons.calendar_today_outlined, size: 64, color: Colors.grey.shade300),
                                  const SizedBox(height: 16),
                                  Text("Aucun créneau disponible", style: TextStyle(color: Colors.grey.shade500, fontSize: 16, fontWeight: FontWeight.w500)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }
                    return RefreshIndicator(
                      color: const Color(0xFF008C45),
                      onRefresh: _fetchPlanning,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(20),
                        itemCount: dayCreneaux.length,
                        itemBuilder: (context, i) {
                          final c = dayCreneaux[i];
                          return SlotCard(creneau: c, showAppel: isEnseignant);
                        },
                      ),
                    );
                  }),
                ),
          ),
        ],
      ),
      floatingActionButton: isEnseignant 
          ? FloatingActionButton.extended(
              onPressed: _showAddSlotDialog,
              backgroundColor: const Color(0xFF008C45),
              icon: const Icon(Icons.add, color: Colors.white),
              label: const Text("Créer", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              elevation: 4,
            )
          : null,
    );
  }
}

class SlotCard extends StatelessWidget {
  final dynamic creneau;
  final bool showAppel;
  const SlotCard({super.key, required this.creneau, this.showAppel = true});

  @override
  Widget build(BuildContext context) {
    bool isAnnule = creneau['est_annule'] ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              left: BorderSide(
                color: isAnnule ? Colors.grey.shade300 : const Color(0xFF008C45),
                width: 6,
              ),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        creneau['titre'] ?? "Sans titre",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          decoration: isAnnule ? TextDecoration.lineThrough : null,
                          color: isAnnule ? Colors.grey.shade400 : const Color(0xFF171717),
                        ),
                      ),
                    ),
                    if (isAnnule)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade100),
                        ),
                        child: Text(
                          "Annulé",
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.red.shade700),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: const Color(0xFFF8FAF8), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.access_time_rounded, size: 18, color: Color(0xFF008C45)),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      "${creneau['heure_debut'].toString().substring(0,5)} - ${creneau['heure_fin'].toString().substring(0,5)}",
                      style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black87),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: const Color(0xFFF8FAF8), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.location_on_rounded, size: 18, color: Color(0xFFF9A825)),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      creneau['centre_nom'] ?? "Centre inconnu",
                      style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black87),
                    ),
                  ],
                ),
                if (!isAnnule && showAppel) ...[
                  const SizedBox(height: 16),
                  const Divider(color: Color(0xFFF0F0F0)),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton.icon(
                        onPressed: () {
                          context.read<PresenceProvider>().selectCreneau(creneau);
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const PresencesScreen()));
                        },
                        icon: const Icon(Icons.checklist_rtl_rounded, size: 20),
                        label: const Text("Faire l'appel", style: TextStyle(fontWeight: FontWeight.bold)),
                        style: TextButton.styleFrom(
                          foregroundColor: const Color(0xFF008C45),
                          backgroundColor: const Color(0xFFE8F5E9),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class AddSlotDialog extends StatefulWidget {
  const AddSlotDialog({super.key});

  @override
  State<AddSlotDialog> createState() => _AddSlotDialogState();
}

class _AddSlotDialogState extends State<AddSlotDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titreController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _startTime = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 10, minute: 0);
  
  bool _isSubmitting = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getInt('user_id') ?? 0;
    
    // Formatage pour le backend
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final startStr = "${_startTime.hour.toString().padLeft(2, '0')}:${_startTime.minute.toString().padLeft(2, '0')}:00";
    final endStr = "${_endTime.hour.toString().padLeft(2, '0')}:${_endTime.minute.toString().padLeft(2, '0')}:00";

    final result = await ApiService().createCreneau({
      "titre": _titreController.text,
      "date": dateStr,
      "heure_debut": startStr,
      "heure_fin": endStr,
      "enseignant": userId,
      "centre": 1, 
      "est_annule": false,
    });

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result['success']) {
      Navigator.pop(context, true);
    } else {
      String message = "Une erreur est survenue.";
      
      if (result['details'] != null && result['details'] is Map) {
        final details = result['details'] as Map;
        if (details.containsKey('detail')) {
          message = details['detail'];
        } else if (details.containsKey('non_field_errors')) {
          message = details['non_field_errors'].join(", ");
        } else if (details.isNotEmpty) {
          message = details.entries.first.value.toString();
        }
      } else if (result['error'] == '403') {
        message = "Vous n'avez pas la permission d'effectuer cette action.";
      } else if (result['error'] == '400') {
        message = "Données invalides ou conflit d'horaire.";
      } else {
        message = "Erreur ${result['error']}";
      }
      
      _showErrorDialog(message);
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Erreur"),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("OK")),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text("Nouveau créneau"),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _titreController,
                decoration: const InputDecoration(labelText: "Titre"),
                validator: (v) => v!.isEmpty ? "Champs requis" : null,
              ),
              const SizedBox(height: 16),
              ListTile(
                title: Text("Date: ${DateFormat('dd/MM/yyyy').format(_selectedDate)}"),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 90)),
                  );
                  if (picked != null) setState(() => _selectedDate = picked);
                },
              ),
              ListTile(
                title: Text("Début: ${_startTime.format(context)}"),
                onTap: () async {
                  final picked = await showTimePicker(context: context, initialTime: _startTime);
                  if (picked != null) setState(() => _startTime = picked);
                },
              ),
              ListTile(
                title: Text("Fin: ${_endTime.format(context)}"),
                onTap: () async {
                  final picked = await showTimePicker(context: context, initialTime: _endTime);
                  if (picked != null) setState(() => _endTime = picked);
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text("Annuler")),
        ElevatedButton(
          onPressed: _isSubmitting ? null : _submit,
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008C45), foregroundColor: Colors.white),
          child: _isSubmitting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text("Créer"),
        ),
      ],
    );
  }
}
