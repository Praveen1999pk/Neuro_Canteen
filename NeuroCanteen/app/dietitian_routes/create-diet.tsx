import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Switch,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Plus, TriangleAlert as AlertTriangle, X, Check } from 'lucide-react-native';

export default function CreateDietScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  
  // Diet combination states
  const [solidSelected, setSolidSelected] = useState(false);
  const [semiSolidSelected, setSemiSolidSelected] = useState(false);
  const [liquidSelected, setLiquidSelected] = useState(false);
  
  // Allergies and dislikes
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [dislikeInput, setDislikeInput] = useState('');
  
  // Additional state variables for dietary preferences
  const [lowSalt, setLowSalt] = useState(false);
  const [diabeticDiet, setDiabeticDiet] = useState(false);
  const [vegetarian, setVegetarian] = useState(false);
  
  // Add allergy
  const addAllergy = () => {
    if (allergyInput.trim()) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };
  
  // Remove allergy
  const removeAllergy = (index: number) => {
    const updatedAllergies = [...allergies];
    updatedAllergies.splice(index, 1);
    setAllergies(updatedAllergies);
  };
  
  // Add dislike
  const addDislike = () => {
    if (dislikeInput.trim()) {
      setDislikes([...dislikes, dislikeInput.trim()]);
      setDislikeInput('');
    }
  };
  
  // Remove dislike
  const removeDislike = (index: number) => {
    const updatedDislikes = [...dislikes];
    updatedDislikes.splice(index, 1);
    setDislikes(updatedDislikes);
  };
  
  // Handle submit
  const handleSubmit = () => {
    // Validate that at least one diet consistency is selected
    if (!solidSelected && !semiSolidSelected && !liquidSelected) {
      Alert.alert(
        "Missing Information", 
        "Please select at least one diet consistency type."
      );
      return;
    }
    
    const dietPlan = {
      consistencies: {
        solid: solidSelected,
        semiSolid: semiSolidSelected,
        liquid: liquidSelected
      },
      allergies,
      dislikes,
      preferences: {
        lowSalt,
        diabeticDiet,
        vegetarian
      }
    };
    
    // console.log('Diet plan created:', dietPlan);
    // router.push('/food');
    const navigateToFood = (diet: object) => {
        navigation.navigate('food', { diet }); // pass as an object with a key
      };
      
      navigateToFood(dietPlan);


  };
  
  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Patient Diet</Text>
          <Text style={styles.headerSubtitle}>
            Define dietary requirements, allergies, and restrictions
          </Text>
        </View>
        
        {/* Diet Consistency Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diet Consistency</Text>
          <Text style={styles.sectionDescription}>
            Select all consistency types that apply to this patient
          </Text>
          
          <View style={styles.consistencyOptions}>
            <TouchableOpacity 
              style={[
                styles.consistencyOption, 
                solidSelected && styles.consistencyOptionSelected
              ]}
              onPress={() => setSolidSelected(!solidSelected)}
            >
              <View style={styles.checkboxContainer}>
                {solidSelected ? (
                  <View style={styles.checkboxSelected}>
                    <Check size={16} color="#fff" />
                  </View>
                ) : (
                  <View style={styles.checkbox} />
                )}
              </View>
              <Text style={styles.consistencyLabel}>Solid</Text>
              <Text style={styles.consistencyDescription}>
                Regular diet with normal food textures
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.consistencyOption, 
                semiSolidSelected && styles.consistencyOptionSelected
              ]}
              onPress={() => setSemiSolidSelected(!semiSolidSelected)}
            >
              <View style={styles.checkboxContainer}>
                {semiSolidSelected ? (
                  <View style={styles.checkboxSelected}>
                    <Check size={16} color="#fff" />
                  </View>
                ) : (
                  <View style={styles.checkbox} />
                )}
              </View>
              <Text style={styles.consistencyLabel}>Semi Solid</Text>
              <Text style={styles.consistencyDescription}>
                Soft, mashed or minced food for easier chewing
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.consistencyOption, 
                liquidSelected && styles.consistencyOptionSelected
              ]}
              onPress={() => setLiquidSelected(!liquidSelected)}
            >
              <View style={styles.checkboxContainer}>
                {liquidSelected ? (
                  <View style={styles.checkboxSelected}>
                    <Check size={16} color="#fff" />
                  </View>
                ) : (
                  <View style={styles.checkbox} />
                )}
              </View>
              <Text style={styles.consistencyLabel}>Liquid</Text>
              <Text style={styles.consistencyDescription}>
                Clear or full liquids for patients with swallowing difficulties
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Dietary Preferences Section
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <Text style={styles.sectionDescription}>
            Special dietary requirements
          </Text>
          
          <View style={styles.preferencesContainer}>
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceTextContainer}>
                <Text style={styles.preferenceLabel}>Low Salt Diet</Text>
                <Text style={styles.preferenceDescription}>Reduced sodium content</Text>
              </View>
              <Switch
                trackColor={{ false: '#cbd5e1', true: '#dcfce7' }}
                thumbColor={lowSalt ? '#16a34a' : '#f1f5f9'}
                onValueChange={setLowSalt}
                value={lowSalt}
              />
            </View>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceTextContainer}>
                <Text style={styles.preferenceLabel}>Diabetic Diet</Text>
                <Text style={styles.preferenceDescription}>Controlled carbohydrates</Text>
              </View>
              <Switch
                trackColor={{ false: '#cbd5e1', true: '#dcfce7' }}
                thumbColor={diabeticDiet ? '#16a34a' : '#f1f5f9'}
                onValueChange={setDiabeticDiet}
                value={diabeticDiet}
              />
            </View>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceTextContainer}>
                <Text style={styles.preferenceLabel}>Vegetarian</Text>
                <Text style={styles.preferenceDescription}>No meat products</Text>
              </View>
              <Switch
                trackColor={{ false: '#cbd5e1', true: '#dcfce7' }}
                thumbColor={vegetarian ? '#16a34a' : '#f1f5f9'}
                onValueChange={setVegetarian}
                value={vegetarian}
              />
            </View>
          </View>
        </View> */}
        
        {/* Allergies Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies</Text>
          <Text style={styles.sectionDescription}>
            Add food items the patient is allergic to
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add allergy"
              value={allergyInput}
              onChangeText={setAllergyInput}
            />
            <TouchableOpacity style={styles.addButton} onPress={addAllergy}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {allergies.length > 0 && (
            <View style={styles.tagsContainer}>
              {allergies.map((allergy, index) => (
                <View key={`allergy-${index}`} style={styles.tag}>
                  <AlertTriangle size={14} color="#dc2626" />
                  <Text style={styles.tagText}>{allergy}</Text>
                  <TouchableOpacity 
                    style={styles.tagRemoveButton} 
                    onPress={() => removeAllergy(index)}
                  >
                    <X size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          
          {allergies.length === 0 && (
            <Text style={styles.emptyStateText}>No allergies added</Text>
          )}
        </View>
        
        {/* Dislikes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dislikes</Text>
          <Text style={styles.sectionDescription}>
            Add food items the patient dislikes
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add dislike"
              value={dislikeInput}
              onChangeText={setDislikeInput}
            />
            <TouchableOpacity style={styles.addButton} onPress={addDislike}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {dislikes.length > 0 && (
            <View style={styles.tagsContainer}>
              {dislikes.map((dislike, index) => (
                <View key={`dislike-${index}`} style={styles.dislikeTag}>
                  <X size={14} color="#f59e0b" />
                  <Text style={styles.tagText}>{dislike}</Text>
                  <TouchableOpacity 
                    style={styles.tagRemoveButton} 
                    onPress={() => removeDislike(index)}
                  >
                    <X size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          
          {dislikes.length === 0 && (
            <Text style={styles.emptyStateText}>No dislikes added</Text>
          )}
        </View>
        
        <View style={styles.spacer} />
      </ScrollView>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Continue to Food Selection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  consistencyOptions: {
    marginTop: 8,
  },
  consistencyOption: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  consistencyOptionSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  checkboxSelected: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consistencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  consistencyDescription: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    flex: 3,
  },
  preferencesContainer: {
    marginTop: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  preferenceTextContainer: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  addButton: {
    width: 48,
    backgroundColor: '#166534',
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  dislikeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#0f172a',
    marginLeft: 4,
    marginRight: 4,
  },
  tagRemoveButton: {
    padding: 2,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  spacer: {
    height: 120,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitButton: {
    backgroundColor: '#166534',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
});