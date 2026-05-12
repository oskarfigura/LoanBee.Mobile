import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { colours, fontFaces, fontSizes } from '@/theme';

const iconPaths = {
  alertTriangle:
    'M12 9v4m0 4h.01M10.615 3.892L2.39 18.098c-.456.788-.684 1.182-.65 1.506a1 1 0 00.406.705c.263.191.718.191 1.629.191h16.45c.91 0 1.365 0 1.628-.191a1 1 0 00.407-.705c.034-.324-.195-.718-.65-1.506L13.383 3.892c-.454-.785-.681-1.178-.978-1.31a1 1 0 00-.813 0c-.296.132-.523.525-.978 1.31z',
  save:
    'M7 3v3.4c0 .56 0 .84.109 1.054a1 1 0 00.437.437C7.76 8 8.04 8 8.6 8h6.8c.56 0 .84 0 1.054-.109a1 1 0 00.437-.437C17 7.24 17 6.96 17 6.4V4m0 17v-6.4c0-.56 0-.84-.109-1.054a1 1 0 00-.437-.437C16.24 13 15.96 13 15.4 13H8.6c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437C7 13.76 7 14.04 7 14.6V21M21 9.325V16.2c0 1.68 0 2.52-.327 3.162a3 3 0 01-1.311 1.311C18.72 21 17.88 21 16.2 21H7.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C3 18.72 3 17.88 3 16.2V7.8c0-1.68 0-2.52.327-3.162a3 3 0 011.311-1.311C5.28 3 6.12 3 7.8 3h6.875c.489 0 .733 0 .963.055.204.05.4.13.579.24.201.123.374.296.72.642l3.126 3.126c.346.346.519.519.642.72.11.18.19.374.24.579.055.23.055.474.055.963z',
  edit:
    'M18 10l-4-4M2.5 21.5l3.384-.376c.414-.046.62-.069.814-.131a2 2 0 00.485-.234c.17-.111.317-.259.61-.553L21 7a2.828 2.828 0 10-4-4L3.794 16.206c-.294.294-.442.442-.553.611a2 2 0 00-.234.485c-.062.193-.085.4-.131.814L2.5 21.5z',
  trash:
    'M9 3h6M3 6h18m-2 0l-.701 10.52c-.105 1.578-.158 2.367-.499 2.965a3 3 0 01-1.298 1.215c-.62.3-1.41.3-2.993.3h-3.018c-1.582 0-2.373 0-2.993-.3A3 3 0 016.2 19.485c-.34-.598-.394-1.387-.499-2.966L5 6m5 4.5v5m4-5v5',
} as const;

interface Props {
  visible: boolean;
  onKeepEditing: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

const Icon = ({
  color,
  path,
  size,
}: {
  color: string;
  path: string;
  size: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d={path}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AlertIcon = () => <Icon color={colours.primary} path={iconPaths.alertTriangle} size={22} />;
const SaveIcon = () => <Icon color={colours.white} path={iconPaths.save} size={18} />;
const EditIcon = () => <Icon color={colours.primaryInk} path={iconPaths.edit} size={18} />;
const DiscardIcon = () => <Icon color={colours.primary} path={iconPaths.trash} size={18} />;

export const UnsavedResultModal = ({
  visible,
  onKeepEditing,
  onSave,
  onDiscard,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepEditing}>
      <Pressable style={styles.scrim} onPress={onKeepEditing}>
        <Pressable style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <AlertIcon />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{t('results.unsavedTitle')}</Text>
            </View>
          </View>
          <Button
            label={t('results.saveBeforeLeaving')}
            onPress={onSave}
            leftIcon={<SaveIcon />}
            style={styles.primaryAction}
          />
          <Button
            label={t('results.keepEditing')}
            onPress={onKeepEditing}
            variant="secondary"
            leftIcon={<EditIcon />}
            style={styles.secondaryAction}
          />
          <Button
            label={t('results.discard')}
            onPress={onDiscard}
            variant="ghost"
            leftIcon={<DiscardIcon />}
            style={styles.ghostAction}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colours.modalScrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: colours.white,
    padding: 20,
    shadowColor: colours.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.focusRing,
    marginRight: 14,
  },
  copy: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    ...fontFaces.heading.extrabold,
    fontSize: fontSizes.xl,
    lineHeight: 30,
    color: colours.textPrimary,
    textAlign: 'left',
  },
  primaryAction: { marginTop: 20 },
  secondaryAction: { marginTop: 10 },
  ghostAction: { marginTop: 4 },
});
