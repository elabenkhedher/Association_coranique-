import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';

class ApiService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: "http://127.0.0.1:cmd8000",
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  ApiService() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Ne pas ajouter le token pour la connexion
        if (options.path.contains("/api/token/")) {
          return handler.next(options);
        }
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (e, handler) {
        print("API ERROR: [${e.response?.statusCode}] ${e.message}");
        if (e.response?.data != null) {
          print("ERROR DATA: ${e.response?.data}");
        }
        return handler.next(e);
      },
    ));
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post("/api/token/", data: {
        "email": email,
        "password": password,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        print("DEBUG LOGIN RESPONSE DATA: $data");
        final String token = data['access'];
        final String role = data['role'] ?? 'apprenant';
        // Supposons que le backend renvoie aussi l'ID
        final int userId = data['user_id'] ?? 0;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', token);
        await prefs.setString('role', role);
        await prefs.setInt('user_id', userId);

        return {
          'success': true,
          ...data,
        };
      }
      return {'success': false, 'error': 'Erreur inconnue'};
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        return {'success': false, 'error': '401'};
      }
      return {'success': false, 'error': e.message};
    }
  }

  Future<List<dynamic>> getUsers({String? role, int? centre}) async {
    final Map<String, dynamic> params = {};
    if (role != null) params["role"] = role;
    if (centre != null) params["centre"] = centre;
    
    final response = await _dio.get("/api/users/", queryParameters: params);
    if (response.data is Map && response.data.containsKey('results')) {
      return response.data['results'];
    }
    return response.data;
  }

  Future<List<dynamic>> getPlanningEnseignant(int id) async {
    final response = await _dio.get("/api/planning/enseignant/$id/");
    return response.data;
  }

  Future<List<dynamic>> getPlanningApprenant(int id) async {
    final response = await _dio.get("/api/planning/apprenant/$id/");
    return response.data;
  }

  Future<Map<String, dynamic>> createCreneau(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post("/api/planning/", data: data);
      return {'success': true, 'data': response.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.statusCode == 400 ? '400' : e.message,
        'details': e.response?.data
      };
    }
  }

  Future<List<dynamic>> getApprenants([int? centreId]) async {
    final Map<String, dynamic> params = {"role": "apprenant"};
    if (centreId != null) params["centre"] = centreId;
    final response = await _dio.get("/api/users/", queryParameters: params);
    // Gestion pagination
    if (response.data is Map && response.data.containsKey('results')) {
      return response.data['results'];
    }
    return response.data;
  }

  Future<List<dynamic>> getPresencesByCreneau(int creneauId) async {
    try {
      final response = await _dio.get("/api/presences/", queryParameters: {"creneau": creneauId});
      if (response.data is Map && response.data.containsKey('results')) {
        return response.data['results'];
      }
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> getTauxPresence(int studentId) async {
    try {
      final response = await _dio.get("/api/presences/apprenant/$studentId/taux/");
      return response.data;
    } catch (e) {
      return {"taux": 0.0, "alerte_absences": null};
    }
  }

  Future<bool> submitPresence(Map<String, dynamic> data) async {
    try {
      await _dio.post("/api/presences/", data: data);
      return true;
    } on DioException catch (e) {
      if (e.response?.statusCode == 400) {
        // Doublon ou erreur métier : on ignore selon la demande
        return true; 
      }
      return false;
    }
  }

  // --- Lectures ---
  Future<List<dynamic>> getLecturesByApprenant(int apprenantId) async {
    try {
      final response = await _dio.get('/api/lectures/apprenant/$apprenantId/');
      return response.data;
    } catch (e) {
      print("Error fetching lectures for $apprenantId: $e");
      return [];
    }
  }

  Future<Map<String, dynamic>> createLecture(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/api/lectures/', data: data);
      return {'success': true, 'data': response.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.statusCode?.toString() ?? 'Unknown',
        'details': e.response?.data
      };
    }
  }

  // --- Statistiques / Progression ---
  Future<Map<String, dynamic>?> getProgression(int apprenantId) async {
    try {
      final response = await _dio.get('/api/statistiques/progression/apprenant/$apprenantId/');
      return response.data;
    } catch (e) {
      print("Error fetching progression for $apprenantId: $e");
      return null;
    }
  }

  // --- Messagerie ---
  Future<List<dynamic>> getConversations() async {
    try {
      final response = await _dio.get('/api/messagerie/conversations/');
      if (response.data is Map && response.data.containsKey('results')) {
        return response.data['results'];
      }
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> createConversation(List<int> participantIds) async {
    try {
      final response = await _dio.post('/api/messagerie/conversations/', data: {
        'participants': participantIds
      });
      return {'success': true, 'data': response.data};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<List<dynamic>> getMessages(int conversationId) async {
    try {
      final response = await _dio.get('/api/messagerie/conversations/$conversationId/messages/');
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<bool> sendMessage(int conversationId, String contenu) async {
    try {
      await _dio.post('/api/messagerie/conversations/$conversationId/messages/', data: {
        'contenu': contenu
      });
      return true;
    } on DioException catch (e) {
      debugPrint("API Error sendMessage: ${e.response?.statusCode} - ${e.response?.data}");
      return false;
    } catch (e) {
      debugPrint("Error sendMessage: $e");
      return false;
    }
  }

  Future<void> markAsRead(int messageId) async {
    try {
      await _dio.post('/api/messagerie/messages/$messageId/lire/');
    } catch (e) {
      // Ignorer l'erreur
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('role');
    await prefs.remove('user_id');
  }
}
