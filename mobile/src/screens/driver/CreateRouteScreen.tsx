import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, typography, spacing } from '@/config/theme';
import { Header } from '@/components/common/Header';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import routesService from '@/services/routes.service';
import studentsService from '@/services/students.service';
import { Student, Coordinates } from '@/types';

interface CreateRouteScreenProps {
  navigation: any;
}

interface LocalStop {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  order: number;
  studentId: string;
  studentName: string;
}

const DEFAULT_REGION = {
  latitude: -3.99,
  longitude: -79.2,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

export const CreateRouteScreen: React.FC<CreateRouteScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [stops, setStops] = useState<LocalStop[]>([]);
  const [newAddress, setNewAddress] = useState('');
  
  // Selección en el mapa
  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(null);
  
  // Estudiantes cargados de la base de datos
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [nameError, setNameError] = useState('');

  // Cargar estudiantes disponibles desde Supabase
  useEffect(() => {
    async function loadStudents() {
      try {
        const list = await studentsService.getAll();
        setStudents(list);
        if (list.length > 0) {
          setSelectedStudent(list[0]);
        }
      } catch (err: any) {
        Alert.alert('Error', 'No se pudieron cargar los estudiantes de Supabase: ' + err.message);
      } finally {
        setLoadingStudents(false);
      }
    }
    loadStudents();
  }, []);

  const handleMapPress = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setSelectedCoords(coords);
    // Rellenar dirección temporal con coordenadas mientras se escribe el nombre del punto
    if (!newAddress.trim()) {
      setNewAddress(`Parada de ${selectedStudent?.name || 'Estudiante'}`);
    }
  };

  const addStop = () => {
    if (!newAddress.trim()) {
      Alert.alert('Falta información', 'Ingresa una descripción o dirección para la parada.');
      return;
    }
    if (!selectedCoords) {
      Alert.alert('Falta ubicación', 'Toca el mapa para ubicar la parada.');
      return;
    }
    if (!selectedStudent) {
      Alert.alert('Falta estudiante', 'Debes seleccionar un estudiante para esta parada.');
      return;
    }

    // Validar que el estudiante no esté ya en la ruta
    if (stops.some(s => s.studentId === selectedStudent.id)) {
      Alert.alert('Atención', `El estudiante ${selectedStudent.name} ya tiene una parada asignada.`);
      return;
    }

    const stop: LocalStop = {
      id: Date.now().toString(),
      address: newAddress.trim(),
      latitude: selectedCoords.latitude,
      longitude: selectedCoords.longitude,
      order: stops.length + 1,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
    };

    setStops((prev) => [...prev, stop]);
    setNewAddress('');
    setSelectedCoords(null);
    
    // Auto-seleccionar el siguiente estudiante libre si existe
    const nextFree = students.find(st => !stops.some(s => s.studentId === st.id) && st.id !== selectedStudent.id);
    if (nextFree) {
      setSelectedStudent(nextFree);
    }
  };

  const removeStop = (id: string) => {
    setStops((prev) =>
      prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 }))
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setNameError('El nombre de la ruta es obligatorio');
      return;
    }
    if (stops.length < 2) {
      Alert.alert('Atención', 'Agrega al menos 2 paradas para poder crear la ruta.');
      return;
    }

    setLoading(true);
    try {
      // 1. Crear la Ruta en Supabase
      const route = await routesService.create({ name: name.trim() });
      
      // 2. Crear cada Parada asociada en Supabase
      for (const stop of stops) {
        await routesService.addStop(route.id, {
          studentId: stop.studentId,
          order: stop.order,
          address: stop.address,
          latitude: stop.latitude,
          longitude: stop.longitude,
          estimatedTime: `${6 + Math.floor(stop.order * 0.15)}:${((stop.order * 10) % 60).toString().padStart(2, '0')}`, // Estimado secuencial
        });
      }

      Alert.alert('Ruta creada', 'La ruta y sus paradas han sido guardadas en Supabase.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo guardar la ruta en Supabase: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Crear Ruta interactiva" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Nombre de la Ruta */}
          <Input
            label="Nombre de la ruta escolar"
            placeholder="Ej: Ruta Norte - Colegio Loja"
            value={name}
            onChangeText={(v) => { setName(v); setNameError(''); }}
            error={nameError}
          />

          <Text style={styles.sectionTitle}>1. Selecciona Parada en el Mapa</Text>
          <Text style={styles.mapHelp}>Toca la pantalla en el mapa para marcar las coordenadas del paradero:</Text>
          
          {/* Mapa para seleccionar coordenadas */}
          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={DEFAULT_REGION}
              onPress={handleMapPress}
            >
              {selectedCoords && (
                <Marker
                  coordinate={selectedCoords}
                  title="Nueva Parada"
                  description="Posición seleccionada"
                />
              )}
              {stops.map((s) => (
                <Marker
                  key={s.id}
                  coordinate={{ latitude: s.latitude, longitude: s.longitude }}
                  title={`${s.order}. ${s.studentName}`}
                  pinColor={colors.success}
                />
              ))}
            </MapView>
          </View>

          {/* Formulario de Parada */}
          <View style={styles.addSection}>
            <Text style={styles.inputLabel}>2. Asignar Estudiante de la Parada</Text>
            {loadingStudents ? (
              <Text style={styles.loadingText}>Cargando estudiantes de Supabase...</Text>
            ) : students.length === 0 ? (
              <Text style={styles.errorText}>No tienes estudiantes registrados. Agrégalos primero.</Text>
            ) : (
              <View style={styles.selectorRow}>
                {students.map((st) => {
                  const isAssigned = stops.some(s => s.studentId === st.id);
                  const isSelected = selectedStudent?.id === st.id;
                  return (
                    <TouchableOpacity
                      key={st.id}
                      disabled={isAssigned}
                      style={[
                        styles.studentChip,
                        isSelected && styles.studentChipSelected,
                        isAssigned && styles.studentChipDisabled,
                      ]}
                      onPress={() => setSelectedStudent(st)}
                    >
                      <Text style={[styles.studentChipText, isSelected && styles.studentChipTextSelected]}>
                        👦 {st.name} {isAssigned ? '(Asignado)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Input
              label="Descripción de la parada / Dirección"
              placeholder="Ej: Frente al Parque Central"
              value={newAddress}
              onChangeText={setNewAddress}
            />

            <Button
              title={selectedCoords ? "+ Agregar parada en este punto" : "📍 Toca el mapa para ubicar parada"}
              onPress={addStop}
              disabled={!selectedCoords || !selectedStudent}
              variant={selectedCoords ? "outline" : "outline"}
              size="md"
              style={styles.addStopBtn}
            />
          </View>

          {/* Lista de paradas agregadas */}
          <Text style={styles.sectionTitle}>Paradas configuradas ({stops.length})</Text>
          {stops.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No has agregado paradas en el mapa todavía.</Text>
            </Card>
          ) : (
            stops.map((stop) => (
              <Card key={stop.id} style={styles.stopCard}>
                <View style={styles.stopHeader}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderText}>{stop.order}</Text>
                  </View>
                  <View style={styles.stopTextContainer}>
                    <Text style={styles.stopStudent}>👦 {stop.studentName}</Text>
                    <Text style={styles.stopAddress} numberOfLines={2}>{stop.address}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeStop(stop.id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </Card>
            ))
          )}

          {/* Botón de creación final */}
          <Button
            title="Guardar Ruta y Paradas en Supabase"
            onPress={handleCreate}
            loading={loading}
            size="lg"
            disabled={stops.length < 2}
            style={styles.createButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  mapHelp: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  mapWrapper: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  map: {
    flex: 1,
  },
  addSection: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  studentChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  studentChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  studentChipDisabled: {
    opacity: 0.4,
    backgroundColor: '#E0E0E0',
  },
  studentChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  studentChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '500',
  },
  addStopBtn: {
    marginTop: spacing.xs,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  stopHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  orderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stopTextContainer: {
    flex: 1,
  },
  stopStudent: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  stopAddress: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    marginTop: 2,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '700',
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  createButton: {
    marginTop: spacing.md,
  },
});
export default CreateRouteScreen;
