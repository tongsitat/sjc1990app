import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ClassroomSelectionScreen extends ConsumerStatefulWidget {
  const ClassroomSelectionScreen({super.key});

  @override
  ConsumerState<ClassroomSelectionScreen> createState() =>
      _ClassroomSelectionScreenState();
}

class _ClassroomSelectionScreenState
    extends ConsumerState<ClassroomSelectionScreen> {
  final Set<String> _selectedClassrooms = {};
  bool _isLoading = true;
  bool _isSaving = false;
  List<Classroom> _availableClassrooms = [];

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
      // TODO: Fetch classrooms from backend API
      // For now, use mock data
      await Future.delayed(const Duration(seconds: 1));

      setState(() {
        _availableClassrooms = [
          Classroom(
            id: '1',
            name: 'Class 1-A (1990)',
            description: 'Class 1-A, graduated 1990',
            year: 1990,
            section: 'A',
            memberCount: 45,
          ),
          Classroom(
            id: '2',
            name: 'Class 1-B (1990)',
            description: 'Class 1-B, graduated 1990',
            year: 1990,
            section: 'B',
            memberCount: 42,
          ),
          Classroom(
            id: '3',
            name: 'Class 1-C (1990)',
            description: 'Class 1-C, graduated 1990',
            year: 1990,
            section: 'C',
            memberCount: 43,
          ),
          Classroom(
            id: '4',
            name: 'Class 1-D (1990)',
            description: 'Class 1-D, graduated 1990',
            year: 1990,
            section: 'D',
            memberCount: 44,
          ),
          Classroom(
            id: '5',
            name: 'Class 1-E (1990)',
            description: 'Class 1-E, graduated 1990',
            year: 1990,
            section: 'E',
            memberCount: 46,
          ),
        ];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load classrooms: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleComplete() async {
    // Validate that at least one classroom is selected
    if (_selectedClassrooms.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one classroom'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      // TODO: Save classroom selections to backend
      await Future.delayed(const Duration(seconds: 1));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 Registration complete! Welcome!'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );

        // Pop all navigation to go back to AuthGate
        // AuthGate will now route to HomePage since user is approved
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save classroom selections: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isSaving = false;
      });
    }
  }

  void _toggleClassroom(String classroomId) {
    setState(() {
      if (_selectedClassrooms.contains(classroomId)) {
        _selectedClassrooms.remove(classroomId);
      } else {
        _selectedClassrooms.add(classroomId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Classrooms'),
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Title
                    const Text(
                      'Select Your Classrooms',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Subtitle
                    const Text(
                      'Step 4 of 4: Choose which classes you were in',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Info Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.info_outline,
                                  color: Colors.blue, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Why select classrooms?',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue,
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 8),
                          Text(
                            '• Connect with classmates from your sections\n'
                            '• See who was in the same class as you\n'
                            '• Tag yourself in old class photos\n'
                            '• You can select multiple classrooms',
                            style: TextStyle(fontSize: 12, color: Colors.black87),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Selected count
                    if (_selectedClassrooms.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green.shade200),
                        ),
                        child: Text(
                          '✓ ${_selectedClassrooms.length} classroom${_selectedClassrooms.length > 1 ? 's' : ''} selected',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.green.shade700,
                          ),
                        ),
                      ),
                    const SizedBox(height: 16),

                    // Classroom List
                    ..._availableClassrooms.map((classroom) {
                      final isSelected =
                          _selectedClassrooms.contains(classroom.id);
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          onTap: _isSaving
                              ? null
                              : () => _toggleClassroom(classroom.id),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? Colors.blue.shade50
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelected
                                    ? Colors.blue
                                    : Colors.grey.shade300,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                // Checkbox
                                Icon(
                                  isSelected
                                      ? Icons.check_box
                                      : Icons.check_box_outline_blank,
                                  color: isSelected
                                      ? Colors.blue
                                      : Colors.grey.shade400,
                                  size: 28,
                                ),
                                const SizedBox(width: 16),

                                // Classroom Info
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        classroom.name,
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: isSelected
                                              ? Colors.blue.shade900
                                              : Colors.black,
                                        ),
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
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),

                    const SizedBox(height: 24),

                    // Complete Button
                    ElevatedButton(
                      onPressed: _isSaving ? null : _handleComplete,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text(
                              'Complete Registration',
                              style: TextStyle(fontSize: 16),
                            ),
                    ),
                    const SizedBox(height: 16),

                    // Help Text
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'ℹ️ You can update your classroom selections anytime in your profile',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

/// Classroom model
class Classroom {
  final String id;
  final String name;
  final String description;
  final int year;
  final String section;
  final int memberCount;

  Classroom({
    required this.id,
    required this.name,
    required this.description,
    required this.year,
    required this.section,
    required this.memberCount,
  });

  factory Classroom.fromJson(Map<String, dynamic> json) {
    return Classroom(
      id: json['classroomId'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      year: json['year'] as int,
      section: json['section'] as String,
      memberCount: json['memberCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'classroomId': id,
      'name': name,
      'description': description,
      'year': year,
      'section': section,
      'memberCount': memberCount,
    };
  }
}
