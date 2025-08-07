import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Clock, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealTimeActivity } from '../../hooks/useRealTimeData';

interface SecurityAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
  severity?: string;
}

export const SecurityAlerts: React.FC = () => {
  const { activities } = useRealTimeActivity();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  useEffect(() => {
    // Convert recent activities to security alerts
    const securityAlerts = activities
      .filter(activity => 
        activity.type === 'create' && 
        (activity.title.includes('vulnerability') || activity.title.includes('Critical'))
      )
      .slice(0, 5)
      .map((activity, index) => ({
        id: activity.id || `alert-${index}`,
        type: activity.severity === 'critical' ? 'critical' : 
              activity.severity === 'warning' ? 'warning' : 'info',
        title: activity.title,
        description: activity.description,
        timestamp: new Date(activity.timestamp),
        resolved: false,
        severity: activity.severity
      }));

    // Add some static alerts for demo
    const staticAlerts: SecurityAlert[] = [
      {
        id: 'static-1',
        type: 'critical',
        title: 'Critical Vulnerability Detected',
        description: 'SQL injection vulnerability found in login system',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        resolved: false
      },
      {
        id: 'static-2',
        type: 'warning',
        title: 'Audit Deadline Approaching',
        description: 'Q1 VAPT assessment due in 3 days',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        resolved: false
      },
      {
        id: 'static-3',
        type: 'info',
        title: 'Security Scan Completed',
        description: 'Weekly vulnerability scan finished successfully',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        resolved: true
      }
    ];

    setAlerts([...securityAlerts, ...staticAlerts].slice(0, 6));
  }, [activities]);

  const getAlertIcon = (type: string, resolved: boolean) => {
    if (resolved) return CheckCircle;
    
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'warning': return Clock;
      case 'info': return Shield;
      default: return AlertTriangle;
    }
  };

  const getAlertColor = (type: string, resolved: boolean) => {
    if (resolved) return 'text-green-600 bg-green-100';
    
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const resolvedAlerts = alerts.filter(alert => alert.resolved);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Security Alerts</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600">
            {activeAlerts.length} active
          </span>
          {activeAlerts.length > 0 && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        <AnimatePresence>
          {alerts.map((alert, index) => {
            const IconComponent = getAlertIcon(alert.type, alert.resolved);
            const colorClasses = getAlertColor(alert.type, alert.resolved);
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-all ${
                  alert.resolved 
                    ? 'bg-slate-50 opacity-75' 
                    : alert.type === 'critical' 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-white border border-slate-200 hover:shadow-sm'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        alert.resolved ? 'text-slate-600' : 'text-slate-900'
                      }`}>
                        {alert.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{alert.description}</p>
                      <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{alert.timestamp.toLocaleTimeString()}</span>
                        {alert.type === 'critical' && !alert.resolved && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            URGENT
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {!alert.resolved && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="text-xs text-green-600 hover:text-green-800 font-medium px-2 py-1 hover:bg-green-50 rounded"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {alerts.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No security alerts</p>
            <p className="text-xs">All systems operating normally</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all alerts
          </button>
          {activeAlerts.length > 0 && (
            <button 
              onClick={() => setAlerts(prev => prev.map(alert => ({ ...alert, resolved: true })))}
              className="text-sm text-slate-600 hover:text-slate-800"
            >
              Mark all resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
};