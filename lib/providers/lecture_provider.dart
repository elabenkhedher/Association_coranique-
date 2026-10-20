import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LectureProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<dynamic> _apprenants = [];
  List<dynamic> _history = [];
  bool _isLoadingApprenants = false;
  bool _isLoadingHistory = false;
  bool _isSaving = false;

  List<dynamic> get apprenants => _apprenants;
  List<dynamic> get history => _history;
  bool get isLoadingApprenants => _isLoadingApprenants;
  bool get isLoadingHistory => _isLoadingHistory;
  bool get isSaving => _isSaving;

  Future<void> fetchApprenants() async {
    _isLoadingApprenants = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      final centreId = prefs.getInt('centre_id') ?? 1; // On suppose centre_id stocké à la connexion
      _apprenants = await _apiService.getApprenants(centreId);
    } catch (e) {
      debugPrint("Error fetching apprenants for lectures: $e");
    } finally {
      _isLoadingApprenants = false;
      notifyListeners();
    }
  }

  Future<void> fetchHistory(int apprenantId) async {
    _isLoadingHistory = true;
    _history = [];
    notifyListeners();
    try {
      _history = await _apiService.getLecturesByApprenant(apprenantId);
    } catch (e) {
      debugPrint("Error fetching history for $apprenantId: $e");
    } finally {
      _isLoadingHistory = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> saveLecture(Map<String, dynamic> data) async {
    _isSaving = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('user_id') ?? 0;
      data['enseignant'] = userId;
      
      final result = await _apiService.createLecture(data);
      return result;
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }
}
