export interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  budget_alerts: boolean
  goal_reminders: boolean
  weekly_reports: boolean
}

export interface NotificationData {
  type: 'budget_alert' | 'goal_reminder' | 'weekly_report' | 'transaction_added'
  title: string
  message: string
  userId: string
  data?: any
}

class NotificationService {
  private settings: NotificationSettings = {
    email_notifications: true,
    push_notifications: true,
    budget_alerts: true,
    goal_reminders: true,
    weekly_reports: false
  }

  async updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    
    if (newSettings.push_notifications && 'Notification' in window) {
      await this.requestPushPermission()
    }
  }

  private async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false

    if (Notification.permission === 'granted') return true

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  async sendPushNotification(data: NotificationData) {
    if (!this.settings.push_notifications) return

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.message,
        icon: '/favicon.ico'
      })
    }
  }

  async sendBudgetAlert(budgetName: string, spent: number, limit: number) {
    if (!this.settings.budget_alerts) return

    const data: NotificationData = {
      type: 'budget_alert',
      title: 'Budget Alert!',
      message: `You've spent ₹${spent.toFixed(0)} of ₹${limit.toFixed(0)} in ${budgetName}`,
      userId: '',
      data: { budgetName, spent, limit }
    }

    await this.sendPushNotification(data)
  }

  async sendGoalReminder(goalName: string, progress: number) {
    if (!this.settings.goal_reminders) return

    const data: NotificationData = {
      type: 'goal_reminder',
      title: 'Goal Progress Update',
      message: `You're ${progress.toFixed(1)}% towards your ${goalName} goal!`,
      userId: '',
      data: { goalName, progress }
    }

    await this.sendPushNotification(data)
  }

  async sendTransactionNotification(type: 'income' | 'expense', amount: number, category: string) {
    const data: NotificationData = {
      type: 'transaction_added',
      title: 'Transaction Added',
      message: `${type === 'income' ? 'Income' : 'Expense'} of ₹${amount} added in ${category}`,
      userId: '',
      data: { type, amount, category }
    }

    await this.sendPushNotification(data)
  }
}

export const notificationService = new NotificationService()