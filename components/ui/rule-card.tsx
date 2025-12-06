import { Colors } from "@/constants/theme";
import { Rule } from "@/types";
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from "./card";



interface RuleCardProps {
    rule: Rule
}

export default function RuleCard({ rule } : RuleCardProps) {
    return (
        <TouchableOpacity onPress={() => router.push(`../rule/${rule.id}`)}>
        <Card variant="lavender" style={styles.ruleCard}>
            <View style={styles.ruleContent}>
            <View style={styles.ruleAvatar}>
                <Text style={styles.ruleAvatarText}>A</Text>
            </View>
            <View style={styles.ruleInfo}>
                <Text style={styles.ruleName}>{rule.name}</Text>
                {rule.description && <Text style={styles.ruleSummary}>{rule.description}</Text>}
            </View>
            </View>
        </Card>
        </TouchableOpacity> 
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  filterSection: {
    flex: 1,
    padding: 12,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.textDark,
  },
  list: {
    padding: 20,
    gap: 12,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ruleCard: {
    marginBottom: 0,
  },
  ruleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ruleAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.avatarText,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 2,
  },
  ruleSummary: {
    fontSize: 12,
    color: Colors.textGray,
  },
});
