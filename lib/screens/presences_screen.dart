import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/presence_provider.dart';
import 'package:intl/intl.dart';

class PresencesScreen extends StatefulWidget {
  const PresencesScreen({super.key});

  @override
  State<PresencesScreen> createState() => _PresencesScreenState();
}

class _PresencesScreenState extends State<PresencesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PresenceProvider>().fetchCreneaux();
    });
  }

  String _formatCreneauLabel(dynamic c) {
    try {
      final DateTime date = DateTime.parse(c['date']);
      final String day = DateFormat('EEEE', 'fr_FR').format(date);
      final String dayCap = day[0].toUpperCase() + day.substring(1);
      return "${c['titre']} - $dayCap ${c['heure_debut']}";
    } catch (e) {
      return "${c['titre']} - ${c['date']} ${c['heure_debut']}";
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PresenceProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF8),
      appBar: AppBar(
        title: const Text("Appel des Présences", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF171717),
        elevation: 0,
        centerTitle: true,
      ),
      body: Column(
        children: [
          _buildHeader(provider),
          Expanded(
            child: provider.isLoadingCreneaux
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF008C45)))
                : provider.creneaux.isEmpty
                    ? _buildNoCreneauxState()
                    : provider.selectedCreneau == null
                        ? _buildEmptySelectionState()
                        : provider.isLoadingApprenants
                            ? const Center(child: CircularProgressIndicator(color: Color(0xFF008C45)))
                            : _buildApprenantsList(provider),
          ),
          if (provider.selectedCreneau != null && !provider.isLoadingApprenants) 
            _buildFooter(provider),
        ],
      ),
    );
  }

  Widget _buildHeader(PresenceProvider provider) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Colors.grey.shade200, width: 1.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Sélectionnez le créneau",
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF171717)),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200, width: 1.5),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<dynamic>(
                isExpanded: true,
                icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF008C45)),
                hint: Text("Choisissez un créneau", style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
                value: provider.selectedCreneau,
                items: provider.creneaux.map((c) {
                  return DropdownMenuItem(
                    value: c,
                    child: Text(_formatCreneauLabel(c), style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF171717))),
                  );
                }).toList(),
                onChanged: (val) => provider.selectCreneau(val),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoCreneauxState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_busy_outlined, size: 80, color: Colors.grey.shade300),
            const SizedBox(height: 24),
            const Text(
              "Aucun créneau disponible",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black54),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptySelectionState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.touch_app_outlined, size: 60, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            "Veuillez sélectionner un créneau",
            style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildApprenantsList(PresenceProvider provider) {
    return ListView.builder(
      padding: const EdgeInsets.all(24),
      itemCount: provider.apprenants.length,
      itemBuilder: (context, index) {
        final a = provider.apprenants[index];
        final stat = provider.stats[a['id']];
        final currentPresence = provider.presences[a['id']];

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
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
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
                          a['nom'][0].toUpperCase(),
                          style: const TextStyle(color: Color(0xFF008C45), fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                "${a['nom']} ${a['prenom']}",
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF171717)),
                              ),
                              if (stat != null && stat['alerte_absences'] != null)
                                const Padding(
                                  padding: EdgeInsets.only(left: 8.0),
                                  child: Icon(Icons.warning_amber_rounded, color: Colors.orangeAccent, size: 20),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          if (stat != null)
                            Row(
                              children: [
                                const Icon(Icons.analytics_outlined, size: 14, color: Colors.grey),
                                const SizedBox(width: 4),
                                Text(
                                  "Taux de présence: ${(stat['taux_presence'] ?? 0).toStringAsFixed(0)}%",
                                  style: TextStyle(color: Colors.grey.shade500, fontSize: 13, fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Divider(color: Color(0xFFF0F0F0), height: 1),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: _buildStatutOption(provider, a['id'], 'present', "Présent", const Color(0xFF008C45), currentPresence == 'present')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildStatutOption(provider, a['id'], 'absent', "Absent", Colors.redAccent, currentPresence == 'absent')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildStatutOption(provider, a['id'], 'excuse', "Excusé", const Color(0xFFF9A825), currentPresence == 'excuse')),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatutOption(PresenceProvider provider, int apprenantId, String statut, String label, Color color, bool isSelected) {
    return GestureDetector(
      onTap: () => provider.updatePresence(apprenantId, statut),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.1) : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? color : Colors.transparent, width: 2),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? color : Colors.grey.shade500,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFooter(PresenceProvider provider) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, -10))],
        border: Border(top: BorderSide(color: Colors.grey.shade100, width: 1.5)),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: provider.isSubmitting ? null : () async {
            final success = await provider.submitPresences();
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(success ? "Présences enregistrées avec succès" : "Erreur lors de l'enregistrement", style: const TextStyle(fontWeight: FontWeight.bold)),
                  backgroundColor: success ? const Color(0xFF008C45) : Colors.redAccent,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                ),
              );
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF008C45),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 8,
            shadowColor: const Color(0xFF008C45).withOpacity(0.4),
          ),
          child: provider.isSubmitting
              ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
              : const Text("Valider les présences", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }
}
