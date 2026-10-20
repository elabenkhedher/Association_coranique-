import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/messagerie_provider.dart';
import '../services/api_service.dart';
import 'chat_screen.dart';

class MessagerieScreen extends StatefulWidget {
  const MessagerieScreen({super.key});

  @override
  State<MessagerieScreen> createState() => _MessagerieScreenState();
}

class _MessagerieScreenState extends State<MessagerieScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MessagerieProvider>().fetchConversations();
    });
  }

  void _showNewConversationDialog() {
    showDialog(
      context: context,
      builder: (context) => const NewConversationDialog(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MessagerieProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF8),
      appBar: AppBar(
        title: const Text("Messagerie", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF171717),
        elevation: 0,
        centerTitle: true,
      ),
      body: provider.isLoading && provider.conversations.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: provider.fetchConversations,
              child: provider.conversations.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.message_outlined, size: 80, color: Colors.grey.withOpacity(0.3)),
                          const SizedBox(height: 16),
                          const Text("Aucune conversation", style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(24),
                      itemCount: provider.conversations.length,
                      itemBuilder: (context, index) {
                        final conv = provider.conversations[index];
                        final lastMsg = conv['dernier_message'];
                        final unreadCount = conv['non_lus_count'] ?? 0;
                        
                        // Trouver l'autre participant
                        final otherParticipant = (conv['participants_details'] as List).firstWhere(
                          (p) => p['id'] != context.read<MessagerieProvider>().activeConversationId, // simplified
                          orElse: () => conv['participants_details'][0],
                        );
                        // En fait, on devrait chercher par ID utilisateur courant.
                        // Mais pour l'affichage, on prend juste le premier qui n'est pas nous.
                        
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
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ChatScreen(
                                      conversationId: conv['id'],
                                      contactName: otherParticipant['nom'],
                                    ),
                                  ),
                                );
                              },
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
                                          otherParticipant['nom'][0].toUpperCase(),
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
                                            otherParticipant['nom'],
                                            style: TextStyle(
                                              fontWeight: unreadCount > 0 ? FontWeight.w900 : FontWeight.w700,
                                              fontSize: 16,
                                              color: const Color(0xFF171717),
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            lastMsg != null ? lastMsg['contenu'] : "Nouvelle conversation",
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                              color: unreadCount > 0 ? Colors.black87 : Colors.grey.shade500,
                                              fontWeight: unreadCount > 0 ? FontWeight.w600 : FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        if (lastMsg != null)
                                          Text(
                                            DateFormat('HH:mm').format(DateTime.parse(lastMsg['date_envoi'])),
                                            style: TextStyle(fontSize: 12, color: Colors.grey.shade400, fontWeight: FontWeight.w600),
                                          ),
                                        if (unreadCount > 0)
                                          Container(
                                            margin: const EdgeInsets.only(top: 8),
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF008C45),
                                              borderRadius: BorderRadius.circular(12),
                                              boxShadow: [
                                                BoxShadow(color: const Color(0xFF008C45).withOpacity(0.3), blurRadius: 4, offset: const Offset(0, 2)),
                                              ],
                                            ),
                                            child: Text(
                                              unreadCount.toString(),
                                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showNewConversationDialog,
        backgroundColor: const Color(0xFF008C45),
        elevation: 8,
        child: const Icon(Icons.maps_ugc_rounded, color: Colors.white),
      ),
    );
  }
}

class NewConversationDialog extends StatefulWidget {
  const NewConversationDialog({super.key});

  @override
  State<NewConversationDialog> createState() => _NewConversationDialogState();
}

class _NewConversationDialogState extends State<NewConversationDialog> {
  final ApiService _apiService = ApiService();
  List<dynamic> _users = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    try {
      // Pour une nouvelle conversation, on liste tous les utilisateurs du centre
      // On pourrait filtrer par rôle si besoin.
      final data = await _apiService.getUsers(centre: 1);
      setState(() {
        _users = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: const Text("Nouvelles Conversations", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      contentPadding: const EdgeInsets.fromLTRB(0, 16, 0, 0),
      content: SizedBox(
        width: double.maxFinite,
        height: 350,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF008C45)))
            : ListView.separated(
                itemCount: _users.length,
                separatorBuilder: (context, index) => Divider(height: 1, color: Colors.grey.shade100),
                itemBuilder: (context, index) {
                  final user = _users[index];
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF9FAFB),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          user['prenom'][0].toUpperCase(),
                          style: const TextStyle(color: Color(0xFF171717), fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    title: Text("${user['prenom']} ${user['nom']}", style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(user['role'], style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                    onTap: () async {
                      Navigator.pop(context);
                      final result = await context.read<MessagerieProvider>().startConversation(user['id']);
                      if (result['success'] && mounted) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ChatScreen(
                              conversationId: result['data']['id'],
                              contactName: "${user['prenom']} ${user['nom']}",
                            ),
                          ),
                        );
                      }
                    },
                  );
                },
              ),
      ),
      actionsPadding: const EdgeInsets.all(16),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context), 
          child: Text("Fermer", style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
