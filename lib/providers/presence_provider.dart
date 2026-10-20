import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PresenceProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<dynamic> _creneaux = [];
  dynamic _selectedCreneau;
  List<dynamic> _apprenants = [];
  Map<int, String> _presences = {}; // apprenantId -> statut ('present', 'absent', 'excuse')
  Map<int, dynamic> _stats = {}; // apprenantId -> {taux, alerte}

  bool _isLoadingCreneaux = false;
  bool _isLoadingApprenants = false;
  bool _isSubmitting = false;

  List<dynamic> get creneaux => _creneaux;
  dynamic get selectedCreneau => _selectedCreneau;
  List<dynamic> get apprenants => _apprenants;
  Map<int, String> get presences => _presences;
  Map<int, dynamic> get stats => _stats;
  bool get isLoadingCreneaux => _isLoadingCreneaux;
  bool get isLoadingApprenants => _isLoadingApprenants;
  bool get isSubmitting => _isSubmitting;

  Future<void> fetchCreneaux() async {
    _isLoadingCreneaux = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('user_id') ?? 0;
      _creneaux = await _apiService.getPlanningEnseignant(userId);
      
      // Si un créneau était déjà sélectionné (ex: via PlanningScreen),
      // on synchronise l'instance avec celle de la nouvelle liste.
      if (_selectedCreneau != null && _creneaux.isNotEmpty) {
        _selectedCreneau = _creneaux.firstWhere(
          (c) => c['id'] == _selectedCreneau['id'],
          orElse: () => _selectedCreneau,
        );
      }
    } catch (e) {
      debugPrint("Error fetching creneaux: $e");
    } finally {
      _isLoadingCreneaux = false;
      notifyListeners();
    }
  }

  Future<void> selectCreneau(dynamic creneau) async {
    // Si le créneau passé vient d'une autre liste (ex: PlanningScreen),
    // on cherche l'instance correspondante dans notre propre liste par ID
    // pour garantir l'identité de l'objet pour le DropdownButton.
    if (creneau != null && _creneaux.isNotEmpty) {
      _selectedCreneau = _creneaux.firstWhere(
        (c) => c['id'] == creneau['id'],
        orElse: () => creneau,
      );
    } else {
      _selectedCreneau = creneau;
    }

    _presences.clear();
    _apprenants.clear();
    notifyListeners();
    
    if (_selectedCreneau != null) {
      await fetchApprenants(_selectedCreneau['centre'] ?? 1);
      await _loadExistingPresences(_selectedCreneau['id']);
    }
  }

  Future<void> fetchApprenants(int centreId) async {
    _isLoadingApprenants = true;
    notifyListeners();
    try {
      _apprenants = await _apiService.getApprenants(centreId);
      // Par défaut, tout le monde est présent
      for (var a in _apprenants) {
        if (!_presences.containsKey(a['id'])) {
          _presences[a['id']] = 'present';
        }
        _fetchStudentStats(a['id']);
      }
    } catch (e) {
      debugPrint("Error fetching apprenants: $e");
    } finally {
      _isLoadingApprenants = false;
      notifyListeners();
    }
  }

  Future<void> _loadExistingPresences(int creneauId) async {
    try {
      final existing = await _apiService.getPresencesByCreneau(creneauId);
      for (var p in existing) {
        _presences[p['apprenant']] = p['statut'];
      }
      notifyListeners();
    } catch (e) {
      debugPrint("Error loading existing presences: $e");
    }
  }

  Future<void> _fetchStudentStats(int studentId) async {
    try {
      final s = await _apiService.getTauxPresence(studentId);
      _stats[studentId] = s;
      notifyListeners();
    } catch (e) {
      debugPrint("Error fetching stats for $studentId: $e");
    }
  }

  void updatePresence(int apprenantId, String statut) {
    _presences[apprenantId] = statut;
    notifyListeners();
  }

  Future<bool> submitPresences() async {
    if (_selectedCreneau == null) return false;
    _isSubmitting = true;
    notifyListeners();

    bool allSuccess = true;
    try {
      for (var entry in _presences.entries) {
        final success = await _apiService.submitPresence({
          "creneau": _selectedCreneau['id'],
          "apprenant": entry.key,
          "statut": entry.value,
        });
        if (!success) allSuccess = false;
      }
      // Re-charger les apprenants pour rafraîchir les statistiques (taux de présence, alertes)
      // si toutes les soumissions ont réussi.
      if (allSuccess) {
        await fetchApprenants(_selectedCreneau['centre'] ?? 1);
      }
    } catch (e) {
      allSuccess = false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
    return allSuccess;
  }
}
