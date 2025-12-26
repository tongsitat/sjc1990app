import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'classroom_selection_screen.dart';

class PreferencesSetupScreen extends ConsumerStatefulWidget {
  const PreferencesSetupScreen({super.key});

  @override
  ConsumerState<PreferencesSetupScreen> createState() =>
      _PreferencesSetupScreenState();
}

class _PreferencesSetupScreenState
    extends ConsumerState<PreferencesSetupScreen> {
  // Communication preferences
  String _primaryChannel = 'app';
  String _notificationFrequency = 'realtime';

  // Privacy settings
  String _phoneVisibility = 'friends';
  String _emailVisibility = 'friends';
  String _photoVisibility = 'everyone';

  bool _isSaving = false;

  Future<void> _handleContinue() async {
    setState(() {
      _isSaving = true;
    });

    try {
      // TODO: Save preferences to backend
      await Future.delayed(const Duration(seconds: 1));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Preferences saved!'),
            backgroundColor: Colors.green,
          ),
        );

        // Navigate to classroom selection
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const ClassroomSelectionScreen(),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save preferences: $e'),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Preferences'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Title
              const Text(
                'Set Your Preferences',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),

              // Subtitle
              const Text(
                'Step 4 of 4: Communication & Privacy',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 32),

              // Communication Preferences Section
              const Text(
                'Communication Preferences',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              // Primary Channel
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Primary Channel',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    RadioListTile<String>(
                      title: const Text('In-App Notifications'),
                      subtitle: const Text('Receive messages in the app'),
                      value: 'app',
                      groupValue: _primaryChannel,
                      onChanged: _isSaving
                          ? null
                          : (value) {
                              setState(() {
                                _primaryChannel = value!;
                              });
                            },
                    ),
                    RadioListTile<String>(
                      title: const Text('Email'),
                      subtitle: const Text('Receive messages via email'),
                      value: 'email',
                      groupValue: _primaryChannel,
                      onChanged: _isSaving
                          ? null
                          : (value) {
                              setState(() {
                                _primaryChannel = value!;
                              });
                            },
                    ),
                    RadioListTile<String>(
                      title: const Text('WhatsApp'),
                      subtitle: const Text('Receive messages via WhatsApp'),
                      value: 'whatsapp',
                      groupValue: _primaryChannel,
                      onChanged: _isSaving
                          ? null
                          : (value) {
                              setState(() {
                                _primaryChannel = value!;
                              });
                            },
                    ),
                    RadioListTile<String>(
                      title: const Text('SMS'),
                      subtitle: const Text('Receive messages via SMS'),
                      value: 'sms',
                      groupValue: _primaryChannel,
                      onChanged: _isSaving
                          ? null
                          : (value) {
                              setState(() {
                                _primaryChannel = value!;
                              });
                            },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Notification Frequency
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Notification Frequency',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    RadioListTile<String>(
                      title: const Text('Real-time'),
                      subtitle:
                          const Text('Get notified immediately for messages'),
                      value: 'realtime',
                      groupValue: _notificationFrequency,
                      onChanged: _isSaving
                          ? null
                          : (value) {
                              setState(() {
                                _notificationFrequency = value!;
                              });
                            },
                    ),
                    RadioListTile<String>(
                      title: const Text('Daily Digest'),
                      subtitle: const Text('Once per day summary'),
                      value: 'daily',
                      groupValue: _notificationFrequency,
                      onChanged: _isSaving
                          ? null
                          : (value) {
                              setState(() {
                                _notificationFrequency = value!;
                              });
                            },
                    ),
                    RadioListTile<String>(
                      title: const Text('Weekly Digest'),
                      subtitle: const Text('Once per week summary'),
                      value: 'weekly',
                      groupValue: _notificationFrequency,
                      onChanged: _isSaving
                          ? null
                          : (value) {
                              setState(() {
                                _notificationFrequency = value!;
                              });
                            },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Privacy Settings Section
              const Text(
                'Privacy Settings',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              // Phone Visibility
              _buildPrivacyDropdown(
                title: 'Who can see your phone number?',
                value: _phoneVisibility,
                onChanged: _isSaving
                    ? null
                    : (value) {
                        setState(() {
                          _phoneVisibility = value!;
                        });
                      },
              ),
              const SizedBox(height: 12),

              // Email Visibility
              _buildPrivacyDropdown(
                title: 'Who can see your email?',
                value: _emailVisibility,
                onChanged: _isSaving
                    ? null
                    : (value) {
                        setState(() {
                          _emailVisibility = value!;
                        });
                      },
              ),
              const SizedBox(height: 12),

              // Photo Visibility
              _buildPrivacyDropdown(
                title: 'Who can see your tagged photos?',
                value: _photoVisibility,
                onChanged: _isSaving
                    ? null
                    : (value) {
                        setState(() {
                          _photoVisibility = value!;
                        });
                      },
              ),
              const SizedBox(height: 32),

              // Continue Button
              ElevatedButton(
                onPressed: _isSaving ? null : _handleContinue,
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
                        'Continue to Classroom Selection',
                        style: TextStyle(fontSize: 16),
                      ),
              ),
              const SizedBox(height: 16),

              // Info
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'ℹ️ You can change these settings anytime in your profile',
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

  Widget _buildPrivacyDropdown({
    required String title,
    required String value,
    required ValueChanged<String?>? onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          DropdownButton<String>(
            value: value,
            isExpanded: true,
            underline: const SizedBox(),
            items: const [
              DropdownMenuItem(
                value: 'everyone',
                child: Text('Everyone'),
              ),
              DropdownMenuItem(
                value: 'friends',
                child: Text('Friends Only'),
              ),
              DropdownMenuItem(
                value: 'nobody',
                child: Text('Nobody'),
              ),
            ],
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
