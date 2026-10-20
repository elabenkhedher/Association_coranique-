import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/lecture_provider.dart';
import 'package:intl/intl.dart';

class SuiviLecturesScreen extends StatefulWidget {
  const SuiviLecturesScreen({super.key});

  @override
  State<SuiviLecturesScreen> createState() => _SuiviLecturesScreenState();
}

class _SuiviLecturesScreenState extends State<SuiviLecturesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LectureProvider>().fetchApprenants();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<LectureProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF8),
      appBar: AppBar(
        title: const Text("Suivi des Lectures", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF171717),
        elevation: 0,
        centerTitle: true,
      ),
      body: provider.isLoadingApprenants
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF008C45)))
          : provider.apprenants.isEmpty
              ? _buildEmptyState()
              : _buildApprenantList(provider),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 80, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text("Aucun apprenant trouvé", style: TextStyle(color: Colors.grey, fontSize: 18)),
        ],
      ),
    );
  }

  Widget _buildApprenantList(LectureProvider provider) {
    return ListView.builder(
      padding: const EdgeInsets.all(24),
      itemCount: provider.apprenants.length,
      itemBuilder: (context, index) {
        final a = provider.apprenants[index];
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
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: () => _showLectureForm(a),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: const Color(0xFF008C45).withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          a['nom']?[0].toUpperCase() ?? "?",
                          style: const TextStyle(color: Color(0xFF008C45), fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "${a['nom']} ${a['prenom']}",
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF171717)),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "ID: ${a['id']}",
                            style: TextStyle(color: Colors.grey.shade500, fontSize: 13, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right_rounded, color: Colors.grey.shade400, size: 28),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _showLectureForm(dynamic apprenant) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => LectureFormSheet(apprenant: apprenant),
    );
  }
}

class LectureFormSheet extends StatefulWidget {
  final dynamic apprenant;
  const LectureFormSheet({super.key, required this.apprenant});

  @override
  State<LectureFormSheet> createState() => _LectureFormSheetState();
}

class _LectureFormSheetState extends State<LectureFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _sourateController = TextEditingController();
  final _debutController = TextEditingController();
  final _finController = TextEditingController();
  final _commentaireController = TextEditingController();
  final _dureeController = TextEditingController(text: "30");

  String _typeLecture = 'hifdh';
  double _evaluation = 3.0;
  bool _isHistoryMode = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(topLeft: Radius.circular(25), topRight: Radius.circular(25)),
      ),
      child: Column(
        children: [
          _buildSheetHeader(),
          Expanded(
            child: _isHistoryMode ? _buildHistoryView() : _buildFormView(),
          ),
        ],
      ),
    );
  }

  Widget _buildSheetHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(topLeft: Radius.circular(25), topRight: Radius.circular(25)),
        border: Border(bottom: BorderSide(color: Colors.grey.shade100, width: 2)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "${widget.apprenant['nom']} ${widget.apprenant['prenom']}",
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF171717)),
                ),
                const SizedBox(height: 4),
                Text(
                  _isHistoryMode ? "Historique des lectures" : "Nouvelle séance de lecture",
                  style: TextStyle(
                    color: _isHistoryMode ? const Color(0xFFF9A825) : const Color(0xFF008C45),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          InkWell(
            onTap: () {
              setState(() {
                _isHistoryMode = !_isHistoryMode;
              });
              if (_isHistoryMode) {
                context.read<LectureProvider>().fetchHistory(widget.apprenant['id']);
              }
            },
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: _isHistoryMode ? const Color(0xFF008C45).withOpacity(0.1) : const Color(0xFFF9A825).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    _isHistoryMode ? Icons.add_circle_outline_rounded : Icons.history_rounded,
                    color: _isHistoryMode ? const Color(0xFF008C45) : const Color(0xFFF9A825),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _isHistoryMode ? "Nouveau" : "Historique",
                    style: TextStyle(
                      color: _isHistoryMode ? const Color(0xFF008C45) : const Color(0xFFF9A825),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormView() {
    final provider = context.watch<LectureProvider>();
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTextField(
              controller: _sourateController,
              label: "Sourate",
              validator: (v) => v!.isEmpty ? "Champs requis" : null,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _debutController,
                    label: "Verset début",
                    keyboardType: TextInputType.number,
                    validator: (v) => v!.isEmpty ? "!" : null,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildTextField(
                    controller: _finController,
                    label: "Verset fin",
                    keyboardType: TextInputType.number,
                    validator: (v) {
                      if (v == null || v.isEmpty) return "!";
                      final fin = int.tryParse(v);
                      final debut = int.tryParse(_debutController.text);
                      if (fin == null) return "Invalide";
                      if (debut != null && fin < debut) return "Fin < Début";
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _typeLecture,
              decoration: InputDecoration(
                labelText: "Type de lecture",
                labelStyle: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w500),
                filled: true,
                fillColor: const Color(0xFFF9FAFB),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade200, width: 1.5)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFF008C45), width: 2)),
              ),
              items: const [
                DropdownMenuItem(value: 'hifdh', child: Text("Hifdh (Mémorisation)", style: TextStyle(fontWeight: FontWeight.w600))),
                DropdownMenuItem(value: 'murajaa', child: Text("Murajaa (Révision)", style: TextStyle(fontWeight: FontWeight.w600))),
                DropdownMenuItem(value: 'tilawa', child: Text("Tilawa (Récitation)", style: TextStyle(fontWeight: FontWeight.w600))),
              ],
              onChanged: (val) => setState(() => _typeLecture = val!),
            ),
            const SizedBox(height: 24),
            const Text("Évaluation :", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF171717))),
            Slider(
              value: _evaluation,
              min: 1,
              max: 5,
              divisions: 4,
              label: _evaluation.round().toString(),
              activeColor: const Color(0xFF008C45),
              inactiveColor: const Color(0xFF008C45).withOpacity(0.2),
              onChanged: (val) => setState(() => _evaluation = val),
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _commentaireController,
              label: "Commentaire pédagogique",
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _dureeController,
              label: "Durée (minutes)",
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: provider.isSaving ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF008C45),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 8,
                  shadowColor: const Color(0xFF008C45).withOpacity(0.4),
                ),
                child: provider.isSaving
                    ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                    : const Text("Enregistrer la séance", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF171717)),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w500),
        filled: true,
        fillColor: const Color(0xFFF9FAFB),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade200, width: 1.5)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFF008C45), width: 2)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.redAccent, width: 1.5)),
      ),
      validator: validator,
    );
  }

  Widget _buildHistoryView() {
    final provider = context.watch<LectureProvider>();
    if (provider.isLoadingHistory) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFF9A825)));
    }
    if (provider.history.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.history_toggle_off_rounded, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text("Aucun historique.", style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(24),
      itemCount: provider.history.length,
      separatorBuilder: (context, index) => const Divider(height: 24),
      itemBuilder: (context, index) {
        final h = provider.history[index];
        final DateTime date = DateTime.parse(h['date_seance']);
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFF9FAFB), borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.menu_book_rounded, color: Color(0xFF008C45), size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "${h['sourate']} (V. ${h['verset_debut']} - ${h['verset_fin']})",
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Color(0xFF171717)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "${DateFormat('dd/MM/yyyy').format(date)} - ${h['type_lecture'].toString().toUpperCase()}",
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(5, (i) => Icon(
                Icons.star_rounded,
                size: 16,
                color: i < h['evaluation'] ? const Color(0xFFF9A825) : Colors.grey.shade200,
              )),
            ),
          ],
        );
      },
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Veuillez corriger les erreurs dans le formulaire"))
      );
      return;
    }

    final provider = context.read<LectureProvider>();
    final data = {
      "apprenant": widget.apprenant['id'],
      "date_seance": DateFormat('yyyy-MM-dd').format(DateTime.now()),
      "sourate": _sourateController.text,
      "verset_debut": int.tryParse(_debutController.text) ?? 0,
      "verset_fin": int.tryParse(_finController.text) ?? 0,
      "type_lecture": _typeLecture,
      "evaluation": _evaluation.round(),
      "commentaire": _commentaireController.text,
      "duree_minutes": int.tryParse(_dureeController.text) ?? 30,
    };

    final result = await provider.saveLecture(data);

    if (mounted) {
      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Séance enregistrée")));
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Erreur: ${result['error']}")));
      }
    }
  }
}
