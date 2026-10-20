import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'planning_screen.dart';
import 'presences_screen.dart';
import 'suivi_lectures_screen.dart';
import 'progression_screen.dart';
import 'messagerie_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();
  String _userRole = 'enseignant';
  bool _isLoadingRole = true;

  @override
  void initState() {
    super.initState();
    _loadUserRole();
  }

  Future<void> _loadUserRole() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _userRole = prefs.getString('role') ?? 'enseignant';
      _isLoadingRole = false;
    });
  }

  Future<void> _handleLogout() async {
    await _apiService.logout();
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/login');
  }

  void _navigateTo(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (context) => screen));
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingRole) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    // Define items based on role
    final List<Map<String, dynamic>> menuItems = _userRole == 'apprenant'
        ? [
            {'title': 'Mon Planning', 'icon': Icons.calendar_month_outlined, 'color': const Color(0xFF008C45), 'screen': const PlanningScreen()},
            {'title': 'Ma Progression', 'icon': Icons.trending_up, 'color': const Color(0xFFF9A825), 'screen': const ProgressionScreen()},
            {'title': 'Messagerie', 'icon': Icons.message_outlined, 'color': Colors.blueAccent, 'screen': const MessagerieScreen()},
          ]
        : [
            {'title': 'Planning', 'icon': Icons.calendar_month_outlined, 'color': const Color(0xFF008C45), 'screen': const PlanningScreen()},
            {'title': 'Présences', 'icon': Icons.how_to_reg_outlined, 'color': Colors.teal, 'screen': const PresencesScreen()},
            {'title': 'Lectures', 'icon': Icons.menu_book_outlined, 'color': Colors.purpleAccent, 'screen': const SuiviLecturesScreen()},
            {'title': 'Messagerie', 'icon': Icons.message_outlined, 'color': Colors.blueAccent, 'screen': const MessagerieScreen()},
          ];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF8),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 220.0,
            floating: false,
            pinned: true,
            elevation: 0,
            backgroundColor: const Color(0xFF008C45),
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                "Association Coranique",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
              ),
              centerTitle: true,
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF006b35), Color(0xFF008C45)],
                        begin: Alignment.bottomRight,
                        end: Alignment.topLeft,
                      ),
                    ),
                  ),
                  Positioned(
                    top: -50,
                    right: -50,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(0.1),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -30,
                    left: -30,
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(0.1),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 48.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 20),
                        const Text(
                          "Salam Alaykoum, ",
                          style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _userRole == 'apprenant' ? "Cher Apprenant" : "Cher Enseignant",
                          style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.logout, color: Colors.white),
                onPressed: _handleLogout,
                tooltip: "Déconnexion",
              ),
            ],
          ),
          
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
              child: Text(
                "Tableau de bord",
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: Colors.grey.shade800,
                  letterSpacing: -0.5,
                ),
              ),
            ),
          ),
          
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 20,
                crossAxisSpacing: 20,
                childAspectRatio: 1.0,
              ),
              delegate: SliverChildBuilderDelegate(
                (BuildContext context, int index) {
                  final item = menuItems[index];
                  return GestureDetector(
                    onTap: () => _navigateTo(item['screen']),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                        border: Border.all(color: Colors.grey.shade100, width: 1.5),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: (item['color'] as Color).withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              item['icon'],
                              size: 36,
                              color: item['color'],
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            item['title'],
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF171717),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
                childCount: menuItems.length,
              ),
            ),
          ),
          
          const SliverPadding(padding: EdgeInsets.only(bottom: 40)),
        ],
      ),
    );
  }
}

