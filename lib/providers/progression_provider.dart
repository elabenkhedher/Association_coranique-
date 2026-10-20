import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ProgressionProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  Map<String, dynamic>? _progressionData;
  List<dynamic> _lectures = [];
  Map<String, dynamic>? _attendanceStats;
  
  bool _isLoading = false;

  Map<String, dynamic>? get progressionData => _progressionData;
  List<dynamic> get lectures => _lectures;
  Map<String, dynamic>? get attendanceStats => _attendanceStats;
  bool get isLoading => _isLoading;

  Future<void> fetchProgression() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('user_id') ?? 0;
      
      // Parallel fetch for better performance
      final results = await Future.wait([
        _apiService.getProgression(userId),
        _apiService.getLecturesByApprenant(userId),
        _apiService.getTauxPresence(userId),
      ]);
      
      _progressionData = results[0] as Map<String, dynamic>?;
      _lectures = results[1] as List<dynamic>;
      _attendanceStats = results[2] as Map<String, dynamic>?;

    } catch (e) {
      debugPrint("Error fetching progression: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
