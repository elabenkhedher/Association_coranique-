import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/messagerie_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ChatScreen extends StatefulWidget {
  final int conversationId;
  final String contactName;

  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.contactName,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  int _myId = 0;

  @override
  void initState() {
    super.initState();
    _loadMyId();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<MessagerieProvider>();
      provider.fetchMessages(widget.conversationId);
      provider.startPolling(widget.conversationId);
    });
  }

  Future<void> _loadMyId() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _myId = prefs.getInt('user_id') ?? 0;
    });
  }

  @override
  void dispose() {
    context.read<MessagerieProvider>().stopPolling();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text;
    if (content.trim().isEmpty) return;

    _messageController.clear();
    final success = await context.read<MessagerieProvider>().sendChatMessage(content);
    
    if (success) {
      _scrollToBottom();
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Échec de l'envoi du message")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF8),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF171717),
        elevation: 0,
        centerTitle: false,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(color: const Color(0xFF008C45).withOpacity(0.1), shape: BoxShape.circle),
              child: Center(
                child: Text(
                  widget.contactName[0].toUpperCase(),
                  style: const TextStyle(fontSize: 16, color: Color(0xFF008C45), fontWeight: FontWeight.w900),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(widget.contactName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF171717))),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: Consumer<MessagerieProvider>(
              builder: (context, provider, child) {
                // Auto-scroll when new messages arrive
                WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                  itemCount: provider.messages.length,
                  itemBuilder: (context, index) {
                    final msg = provider.messages[index];
                    final isMe = msg['expediteur'] == _myId;
                    
                    return _MessageBubble(
                      message: msg['contenu'],
                      time: msg['date_envoi'],
                      isMe: isMe,
                    );
                  },
                );
              },
            ),
          ),
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, -10))],
        border: Border(top: BorderSide(color: Colors.grey.shade100, width: 1.5)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.grey.shade200, width: 1.5),
                ),
                child: TextField(
                  controller: _messageController,
                  maxLines: null,
                  style: const TextStyle(fontWeight: FontWeight.w500, color: Color(0xFF171717)),
                  decoration: InputDecoration(
                    hintText: "Écrivez votre message...",
                    hintStyle: TextStyle(color: Colors.grey.shade500),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF008C45),
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: const Color(0xFF008C45).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))],
              ),
              child: IconButton(
                icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                onPressed: _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final String message;
  final String time;
  final bool isMe;

  const _MessageBubble({
    required this.message,
    required this.time,
    required this.isMe,
  });

  @override
  Widget build(BuildContext context) {
    final dateTime = DateTime.parse(time);
    final timeStr = DateFormat('HH:mm').format(dateTime);

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isMe ? const Color(0xFF008C45) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: isMe ? const Radius.circular(20) : const Radius.circular(0),
            bottomRight: isMe ? const Radius.circular(0) : const Radius.circular(20),
          ),
          border: isMe ? null : Border.all(color: Colors.grey.shade100, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: isMe ? const Color(0xFF008C45).withOpacity(0.2) : Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              message,
              style: TextStyle(
                color: isMe ? Colors.white : const Color(0xFF171717),
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              timeStr,
              style: TextStyle(
                color: isMe ? Colors.white.withOpacity(0.7) : Colors.grey.shade500,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
