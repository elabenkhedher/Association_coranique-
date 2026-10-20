import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/progression_provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';

class ProgressionScreen extends StatefulWidget {
  const ProgressionScreen({super.key});

  @override
  State<ProgressionScreen> createState() => _ProgressionScreenState();
}

class _ProgressionScreenState extends State<ProgressionScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProgressionProvider>().fetchProgression();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProgressionProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF8),
      appBar: AppBar(
        title: const Text("Ma Progression", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF171717),
        elevation: 0,
        centerTitle: true,
      ),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF008C45)))
          : provider.progressionData == null
              ? _buildNoDataState()
              : RefreshIndicator(
                  onRefresh: () => provider.fetchProgression(),
                  color: const Color(0xFF008C45),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildGlobalStats(provider),
                        const SizedBox(height: 24),
                        _buildEvolutionChart(provider),
                        const SizedBox(height: 24),
                        _buildAttendanceSection(provider),
                        const SizedBox(height: 24),
                        const Text(
                          "Détail par Sourate",
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 12),
                        _buildSouratesList(provider),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildNoDataState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.auto_graph, size: 80, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text(
            "Aucune donnée disponible", 
            style: TextStyle(color: Colors.grey, fontSize: 18, fontWeight: FontWeight.bold)
          ),
          const SizedBox(height: 8),
          const Text(
            "Commencez vos séances de lecture pour voir votre progression.",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildGlobalStats(ProgressionProvider provider) {
    final data = provider.progressionData!;
    final double progression = (data['progression_globale'] ?? 0.0) / 100.0;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF006b35), Color(0xFF008C45)],
          begin: Alignment.bottomRight,
          end: Alignment.topLeft,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF008C45).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatItem("Juzaa Validés", "${data['juzaa_valides']}/30", Icons.bookmark_rounded),
              _buildStatItem("Progression", "${(progression * 100).toStringAsFixed(1)}%", Icons.trending_up_rounded),
            ],
          ),
          const SizedBox(height: 24),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: LinearProgressIndicator(
              value: progression,
              minHeight: 12,
              backgroundColor: Colors.white.withOpacity(0.2),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFF9A825)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900)),
      ],
    );
  }

  Widget _buildEvolutionChart(ProgressionProvider provider) {
    if (provider.lectures.isEmpty) return const SizedBox.shrink();

    // Preparer les données pour le graphique
    // On trie par date et on prend les 10 dernières séances
    final sortedLectures = List.from(provider.lectures)
      ..sort((a, b) => a['date_seance'].compareTo(b['date_seance']));
    
    final recentLectures = sortedLectures.length > 10 
        ? sortedLectures.sublist(sortedLectures.length - 10) 
        : sortedLectures;

    List<FlSpot> spots = [];
    for (int i = 0; i < recentLectures.length; i++) {
      spots.add(FlSpot(i.toDouble(), recentLectures[i]['evaluation'].toDouble()));
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade100, width: 1.5),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: const Color(0xFF008C45).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.analytics_rounded, size: 18, color: Color(0xFF008C45)),
                ),
                const SizedBox(width: 12),
                const Text("Évolution des évaluations", style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF171717))),
              ],
            ),
            const SizedBox(height: 32),
            SizedBox(
              height: 180,
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(show: true, drawVerticalLine: false, horizontalInterval: 1, getDrawingHorizontalLine: (value) => FlLine(color: Colors.grey.shade100, strokeWidth: 1)),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(showTitles: true, reservedSize: 30, interval: 1, getTitlesWidget: (val, meta) => Text(val.toInt().toString(), style: TextStyle(color: Colors.grey.shade500, fontSize: 12))),
                    ),
                    bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  minX: 0,
                  maxX: (recentLectures.length - 1).toDouble(),
                  minY: 0,
                  maxY: 5,
                  lineBarsData: [
                    LineChartBarData(
                      spots: spots,
                      isCurved: true,
                      color: const Color(0xFFF9A825),
                      barWidth: 4,
                      isStrokeCapRound: true,
                      dotData: FlDotData(show: true, getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(radius: 4, color: Colors.white, strokeWidth: 2, strokeColor: const Color(0xFFF9A825))),
                      belowBarData: BarAreaData(
                        show: true,
                        gradient: LinearGradient(colors: [const Color(0xFFF9A825).withOpacity(0.3), const Color(0xFFF9A825).withOpacity(0.0)], begin: Alignment.topCenter, end: Alignment.bottomCenter),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceSection(ProgressionProvider provider) {
    final stats = provider.attendanceStats;
    if (stats == null) return const SizedBox.shrink();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100, width: 1.5),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: const Color(0xFFE8F5E9), borderRadius: BorderRadius.circular(12)),
          child: const Icon(Icons.how_to_reg_rounded, color: Color(0xFF008C45), size: 24),
        ),
        title: const Text("Taux de présence", style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF171717))),
        subtitle: Text("${stats['total_seances']} séances au total", style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
        trailing: Text(
          "${(stats['taux_presence'] ?? 0).toStringAsFixed(0)}%",
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF008C45)),
        ),
      ),
    );
  }

  Widget _buildSouratesList(ProgressionProvider provider) {
    final details = provider.progressionData!['juzaa_details'] as List<dynamic>;

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: details.length,
      itemBuilder: (context, index) {
        final d = details[index];
        final bool isValide = d['valide'] ?? false;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade100, width: 1.5),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            title: Text(d['sourate'], style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Color(0xFF171717))),
            subtitle: Text("${d['nb_seances']} séances - Moy. : ${d['evaluation_moyenne']}", style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w500, fontSize: 13)),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isValide ? const Color(0xFF008C45).withOpacity(0.1) : const Color(0xFFF9A825).withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isValide ? Icons.check_circle_rounded : Icons.sync_rounded,
                    size: 14,
                    color: isValide ? const Color(0xFF008C45) : const Color(0xFFF9A825),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isValide ? "Validé" : "En cours",
                    style: TextStyle(
                      color: isValide ? const Color(0xFF008C45) : const Color(0xFFF9A825),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
