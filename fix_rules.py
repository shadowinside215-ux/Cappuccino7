import re

with open('firestore.rules', 'r') as f:
    rules = f.read()

old_rule = "(isStaff() && incoming().diff(existing()).affectedKeys().hasAny(['waiterId', 'waiterName', 'waiterStatus', 'status', 'kitchenStatus', 'barmanStatus', 'isPaid', 'paymentMethod', 'updatedAt', 'verificationToken', 'deliveredAt', 'paidAt', 'deliveredInMinutes', 'readyInMinutes', 'readyAt', 'preparingAt', 'completedAt', 'kitchenStartedAt', 'kitchenReadyAt', 'kitchenCompletedAt', 'barmanStartedAt', 'barmanReadyAt', 'barmanCompletedAt']));"
new_rule = "(isStaff());"

rules = rules.replace(old_rule, new_rule)

with open('firestore.rules', 'w') as f:
    f.write(rules)

print("Rules updated.")
