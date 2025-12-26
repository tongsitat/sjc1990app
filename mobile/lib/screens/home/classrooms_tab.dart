import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Classrooms tab - shows user's classrooms and classroom feeds
class ClassroomsTab extends ConsumerStatefulWidget {
  const ClassroomsTab({super.key});

  @override
  ConsumerState<ClassroomsTab> createState() => _ClassroomsTabState();
}

class _ClassroomsTabState extends ConsumerState<ClassroomsTab> {
  bool _isLoading = true;
  final List<ClassroomItem> _classrooms = [];

  @override
  void initState() {
    super.initState();
    _loadClassrooms();
  }

  Future<void> _loadClassrooms() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // TODO: Load user's classrooms from backend
      await Future.delayed(const Duration(seconds: 1));

      setState(() {
        // Mock data - user's selected classrooms
        _classrooms.addAll([
          ClassroomItem(
            id: '1',
            name: 'Class 1-A (1990)',
            description: 'Class 1-A, graduated 1990',
            memberCount: 45,
            unreadCount: 3,
            lastActivity: DateTime.now().subtract(const Duration(hours: 1)),
          ),
          ClassroomItem(
            id: '3',
            name: 'Class 1-C (1990)',
            description: 'Class 1-C, graduated 1990',
            memberCount: 43,
            unreadCount: 0,
            lastActivity: DateTime.now().subtract(const Duration(days: 2)),
          ),
        ]);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Classrooms'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _classrooms.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: _classrooms.length,
                  itemBuilder: (context, index) {
                    return _buildClassroomCard(_classrooms[index]);
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.school_outlined,
            size: 80,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            'No classrooms yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Select your classrooms in settings',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClassroomCard(ClassroomItem classroom) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: () {
          // TODO: Navigate to classroom detail screen
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Opening ${classroom.name}...'),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Classroom Icon
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: Colors.blue.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.school,
                      size: 32,
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 16),

                  // Classroom Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                classroom.name,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            if (classroom.unreadCount > 0)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.blue,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '${classroom.unreadCount}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          classroom.description,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              Icons.people,
                              size: 14,
                              color: Colors.grey.shade600,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${classroom.memberCount} members',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Icon(
                              Icons.access_time,
                              size: 14,
                              color: Colors.grey.shade600,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _formatTimestamp(classroom.lastActivity),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${timestamp.day}/${timestamp.month}/${timestamp.year}';
    }
  }
}

/// Classroom item model
class ClassroomItem {
  final String id;
  final String name;
  final String description;
  final int memberCount;
  final int unreadCount;
  final DateTime lastActivity;

  ClassroomItem({
    required this.id,
    required this.name,
    required this.description,
    required this.memberCount,
    required this.unreadCount,
    required this.lastActivity,
  });

  factory ClassroomItem.fromJson(Map<String, dynamic> json) {
    return ClassroomItem(
      id: json['classroomId'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      memberCount: json['memberCount'] as int? ?? 0,
      unreadCount: json['unreadCount'] as int? ?? 0,
      lastActivity: DateTime.parse(json['lastActivity'] as String),
    );
  }
}
