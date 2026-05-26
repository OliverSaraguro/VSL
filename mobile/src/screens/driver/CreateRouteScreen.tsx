import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Header } from '@/components/common/Header';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import routesService from '@/services/routes.service';

interface CreateRouteScreenProps {
  navigation: any;
}

interface Stop {
  id: string;
  address: string;
  order: number;
}

export const CreateRouteScreen: React.FC<CreateRouteScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  const addStop = () => {
    if (!newAddress.trim()) return;
    const stop: Stop = {
      id: Date.now().toString(),
      address: newAddress.trim(),
      order: stops.length + 1,
    };
    setStops((prev) => [...prev, stop]);
    setNewAddress('');
  };

  const removeStop = (id: string) => {
    setStops((prev) =>
      prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 }))
    );
  };

  const moveStop = (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= stops.length) return;
    const updated = [...stops];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setStops(updated.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setNameError('El nombre de la ruta es obligatorio');
      return;
    }
    if (stops.length < 2) {
      Alert.alert('Atención', 'Agrega al menos 2 paradas para crear la ruta.');
      return;
    }
    setLoading(true);
    try {
      await routesService.create({ name: name.trim() });
      Alert.alert('Ruta creada', 'La ruta se ha creado exitosamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo crear la ruta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Crear Ruta" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Input
            label="Nombre de la ruta"
            placeholder="Ej: Ruta Centro-Norte"
            value={name}
            onChangeText={(v) => { setName(v); setNameError(''); }}
            error={nameError}
          />

          <Text style={styles.sectionTitle}>Paradas ({stops.length})</Text>

          {stops.map((stop, index) => (
            <Card key={stop.id} style={styles.stopCard}>
              <View style={styles.stopHeader}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{stop.order}</Text>
                </View>
                <Text style={styles.stopAddress} numberOfLines={2}>{stop.address}</Text>
              </View>
              <View style={styles.stopActions}>
                <TouchableOpacity
                  onPress={() => moveStop(index, 'up')}
                  disabled={index === 0}
                  style={[styles.actionBtn, index === 0 && styles.actionDisabled]}
                >
                  <Text style={styles.actionText}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveStop(index, 'down')}
                  disabled={index === stops.length - 1}
                  style={[styles.actionBtn, index === stops.length - 1 && styles.actionDisabled]}
                >
                  <Text style={styles.actionText}>▼</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeStop(stop.id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}

          <View style={styles.addSection}>
            <Input
              label="Dirección de la parada"
              placeholder="Ej: Av. Universitaria y Sucre"
              value={newAddress}
              onChangeText={setNewAddress}
            />
            <Button
              title="+ Agregar parada"
              onPress={addStop}
              variant="outline"
              size="sm"
            />
          </View>

          <Button
            title="Crear Ruta"
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
    padding: spacing.xl,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
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
  stopAddress: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  stopActions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: spacing.sm,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDisabled: {
    opacity: 0.3,
  },
  actionText: {
    fontSize: 14,
    color: colors.text,
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
  addSection: {
    marginTop: spacing.md,
  },
  createButton: {
    marginTop: spacing.xl,
  },
});
