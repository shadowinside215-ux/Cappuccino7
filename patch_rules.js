import fs from 'fs';
let content = fs.readFileSync('firestore.rules', 'utf8');

const regex = /\(isStaff\(\) && \([\s\S]*?hasAny\(\['status', 'updatedAt', 'deliveredAt'\]\)\)\s*\)\)/;
const newRules = `(isStaff() && incoming().diff(existing()).affectedKeys().hasAny(['waiterId', 'waiterName', 'waiterStatus', 'status', 'kitchenStatus', 'barmanStatus', 'isPaid', 'paymentMethod', 'updatedAt', 'verificationToken', 'deliveredAt', 'paidAt', 'deliveredInMinutes', 'readyInMinutes', 'readyAt', 'preparingAt', 'completedAt', 'kitchenStartedAt', 'kitchenReadyAt', 'kitchenCompletedAt', 'barmanStartedAt', 'barmanReadyAt', 'barmanCompletedAt']))`;

if (regex.test(content)) {
    content = content.replace(regex, newRules);
    fs.writeFileSync('firestore.rules', content);
    console.log("Updated firestore.rules successfully with regex");
} else {
    console.log("Failed to find rules block entirely");
}
