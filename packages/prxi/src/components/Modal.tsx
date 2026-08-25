import React from 'react';
import { Box, Text } from 'ink';

const colors = {
  bgPrimary: '#0d1117',
  borderColor: '#30363d',
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  accentCyan: '#39c5cf',
  accentRed: '#f85149',
};

interface ModalProps {
  title: string;
  children: React.ReactNode;
  width?: number;
  showCancel?: boolean;
  onCancel?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  children,
  width = 70,
  showCancel = true,
  onCancel,
}) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.accentCyan}
      paddingX={2}
      paddingY={1}
      width={width}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={colors.accentCyan}>
          {title}
        </Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column">{children}</Box>

      {/* Footer */}
      {showCancel && onCancel && (
        <Box marginTop={1}>
          <Text color={colors.textSecondary}>Press </Text>
          <Text bold color={colors.textPrimary}>
            Esc
          </Text>
          <Text color={colors.textSecondary}>
            {' '}
            to cancel
          </Text>
        </Box>
      )}
    </Box>
  );
};

// Confirm modal for yes/no choices
interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  danger = false,
}) => {
  return (
    <Modal title={title} showCancel={false}>
      <Text color={colors.textPrimary}>{message}</Text>
      <Box marginTop={1}>
        <Text
          color={danger ? colors.accentRed : colors.accentCyan}
          bold
        >
          [Y]
        </Text>
        <Text color={colors.textSecondary}> {confirmLabel}  </Text>
        <Text color={colors.textSecondary} bold>
          [N]
        </Text>
        <Text color={colors.textSecondary}> {cancelLabel}</Text>
      </Box>
    </Modal>
  );
};

// Input field component for use within modals
interface InputFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  focused?: boolean;
  masked?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  placeholder = '',
  focused = false,
  masked = false,
}) => {
  const displayValue = masked ? '*'.repeat(value.length) : value;
  const cursor = focused ? '_' : '';

  return (
    <Box flexDirection="column" marginY={0}>
      <Text color={colors.textSecondary}>{label}:</Text>
      <Box>
        <Text color={colors.textPrimary}>
          {' '}
          {displayValue || (
            <Text color={colors.textSecondary}>{placeholder}</Text>
          )}
          {focused && (
            <Text color={colors.accentCyan}>{cursor}</Text>
          )}
        </Text>
      </Box>
    </Box>
  );
};

// Select option component
interface SelectOptionProps {
  label: string;
  description?: string;
  selected: boolean;
  icon?: string;
}

export const SelectOption: React.FC<SelectOptionProps> = ({
  label,
  description,
  selected,
  icon,
}) => {
  return (
    <Box>
      <Text color={selected ? colors.accentCyan : colors.textTertiary}>
        {selected ? '▶ ' : '  '}
      </Text>
      {icon && <Text> {icon} </Text>}
      <Text
        color={selected ? colors.accentCyan : colors.textPrimary}
        bold={selected}
      >
        {label}
      </Text>
      {description && (
        <Text color={colors.textSecondary}> - {description}</Text>
      )}
    </Box>
  );
};

// Add textTertiary to colors for SelectOption
const colorsExtended = {
  ...colors,
  textTertiary: '#6e7681',
};

// Re-export with extended colors for components that need it
export { colorsExtended as colors };