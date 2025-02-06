import { supabase } from './supabase';

export interface BackupLog {
  id: string;
  created_at: string;
  created_by: string;
  file_name: string;
  file_size: number;
  backup_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error_message?: string;
  completed_at?: string;
}

export interface BackupData {
  backup_id: string;
  created_at: string;
  type: string;
  tables: {
    vehicles: any[];
    vehicle_expenses: any[];
    profit_distributions: any[];
    transactions: any[];
    categories: any[];
    financial_settings: any[];
    global_settings: any[];
  };
}

export const backupService = {
  async createBackup(): Promise<BackupData> {
    try {
      const { data, error } = await supabase
        .rpc('create_backup', { p_type: 'manual' });

      if (error) throw error;
      if (!data) throw new Error('No backup data received');

      return data as BackupData;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  },

  async restoreBackup(backup: BackupData): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('restore_backup', { p_backup_data: backup });

      if (error) throw error;
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  },

  downloadBackup(backup: BackupData): void {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async uploadBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string);
          if (!this.isValidBackup(backup)) {
            throw new Error('Invalid backup file format');
          }
          resolve(backup);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      reader.readAsText(file);
    });
  },

  isValidBackup(backup: any): backup is BackupData {
    return (
      backup &&
      typeof backup.backup_id === 'string' &&
      typeof backup.created_at === 'string' &&
      typeof backup.type === 'string' &&
      backup.tables &&
      Array.isArray(backup.tables.vehicles) &&
      Array.isArray(backup.tables.vehicle_expenses) &&
      Array.isArray(backup.tables.profit_distributions) &&
      Array.isArray(backup.tables.transactions) &&
      Array.isArray(backup.tables.categories) &&
      Array.isArray(backup.tables.financial_settings) &&
      Array.isArray(backup.tables.global_settings)
    );
  }
};