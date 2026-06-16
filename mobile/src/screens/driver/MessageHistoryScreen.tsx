import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Header } from '@/components/common/Header';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/EmptyState';
import { Card } from '@/components/common/Card';
import messagesService, { RouteMessage } from '@/servicios/messages.service';

interface MessageHistoryScreenProps {
  navigation: any;
  route: { params: { routeId: string } };
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-EC', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// HU30: pantalla que muestra el historial de mensajes predefinidos enviados a los padres de
// la ruta (el envío en sí ocurre desde ActiveRouteScreen; aquí solo se consulta lo ya guardado).
export const MessageHistoryScreen: React.FC<MessageHistoryScreenProps> = ({ navigation, route: navRoute }) => {
  const { routeId } = navRoute.params;
  const [messages, setMessages] = useState<RouteMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await messagesService.getHistory(routeId);
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Header title="Mensajes enviados" onBack={() => navigation.goBack()} />
      {messages.length === 0 ? (
        <EmptyState
          icon="chat"
          title="Sin mensajes"
          message="Todavía no se ha enviado ningún mensaje predefinido en esta ruta."
        />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card style={styles.row}>
              <Text style={styles.content}>{item.content}</Text>
              <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 32 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm },
  content: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
  time: { fontSize: typography.small.fontSize, color: colors.textSecondary },
});
