import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MessagerieProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<dynamic> _conversations = [];
  List<dynamic> _messages = [];
  bool _isLoading = false;
  int? _activeConversationId;
  Timer? _pollingTimer;

  List<dynamic> get conversations => _conversations;
  List<dynamic> get messages => _messages;
  bool get isLoading => _isLoading;
  int? get activeConversationId => _activeConversationId;

  // --- Conversations ---
  Future<void> fetchConversations() async {
    _isLoading = true;
    notifyListeners();
    try {
      _conversations = await _apiService.getConversations();
    } catch (e) {
      debugPrint("Error fetching conversations: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> startConversation(int userId) async {
    final result = await _apiService.createConversation([userId]);
    if (result['success']) {
      await fetchConversations();
    }
    return result;
  }

  // --- Messages ---
  Future<void> fetchMessages(int conversationId) async {
    _activeConversationId = conversationId;
    try {
      final newMessages = await _apiService.getMessages(conversationId);
      _messages = newMessages;
      notifyListeners();
      
      // Marquer comme lus les messages reçus qui ne sont pas de moi
      final prefs = await SharedPreferences.getInstance();
      final myId = prefs.getInt('user_id') ?? 0;
      
      for (var msg in _messages) {
        if (msg['expediteur'] != myId && msg['lu'] == false) {
          await _apiService.markAsRead(msg['id']);
        }
      }
    } catch (e) {
      debugPrint("Error fetching messages: $e");
    }
  }

  Future<bool> sendChatMessage(String content) async {
    if (_activeConversationId == null || content.trim().isEmpty) return false;
    
    final success = await _apiService.sendMessage(_activeConversationId!, content);
    if (success) {
      await fetchMessages(_activeConversationId!);
    }
    return success;
  }

  // --- Polling ---
  void startPolling(int conversationId) {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      fetchMessages(conversationId);
    });
  }

  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
    _activeConversationId = null;
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}
