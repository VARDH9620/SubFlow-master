import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, GitBranch, BarChart3, Shield, Users, Mail, Check } from 'lucide-react';
import * as db from '../../db/database';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Badge, Modal, PageHeader, SearchBar } from '../../components/ui';
import type { Service, Plan } from '../../types';

const iconMap: Record<string, React.ReactNode> = {
  Cloud: <Cloud className="w-6 h-6" />,
  GitBranch: <GitBranch className="w-6 h-6" />,
  BarChart3: <BarChart3 className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  Users: <Users className="w-6 h-6" />,
  Mail: <Mail className="w-6 h-6" />,
};

export default function Services() {
  const { user, addToast } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSvc, setSelectedSvc] = useState<Service | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const allServices = await db.getAllServices();
      setServices(allServices.filter(s => s.status === 'active'));
      const allPlans = await db.getAllPlans();
      setPlans(allPlans);
      // Artificial slight delay for smoothness if cached, otherwise the skeleton flashes too fast
      setTimeout(() => setLoading(false), 200);
    };
    loadData();
  }, []);

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubscribe = async (plan: Plan) => {
    if (!user) return;
    await db.createSubscription(user.id, plan.id);
    addToast(`Subscribed to ${plan.name} successfully!`, 'success');
    setShowPlans(false);
    setSelectedSvc(null);
  };

  const svcPlans = selectedSvc ? plans.filter(p => p.service_id === selectedSvc.id && p.status === 'active') : [];

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Services"
        description="Browse and subscribe to available services"
        action={<SearchBar value={search} onChange={setSearch} placeholder="Search services..." />}
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card/50 p-6 h-[220px] flex flex-col justify-between">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 rounded skeleton" />
                  <div className="h-4 w-1/3 rounded skeleton" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 w-full rounded skeleton" />
                <div className="h-4 w-5/6 rounded skeleton" />
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-border/50">
                <div className="h-6 w-24 rounded skeleton" />
                <div className="h-8 w-24 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
        {filtered.map(svc => {
          const svcPlansCount = plans.filter(p => p.service_id === svc.id && p.status === 'active').length;
          const minPrice = Math.min(...plans.filter(p => p.service_id === svc.id && p.status === 'active').map(p => p.price));

          return (
            <motion.div 
              key={svc.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 300 } }
              }}
            >
              <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-primary-50 dark:bg-primary-500/10 text-primary rounded-xl">
                    {iconMap[svc.icon] || <Cloud className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{svc.name}</h3>
                    <Badge className="mt-1">{svc.category}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground dark:text-slate-300 mb-4 flex-grow">{svc.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-border/50 dark:border-dark-surface-3/60 mt-auto">
                  <div>
                    <span className="text-lg font-bold text-foreground dark:text-white">${minPrice.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground dark:text-slate-300">/mo</span>
                    <p className="text-xs text-muted-foreground/80 dark:text-slate-400">{svcPlansCount} plans available</p>
                  </div>
                  <Button size="sm" onClick={() => { setSelectedSvc(svc); setShowPlans(true); }}>
                    View Plans
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
        </motion.div>
      )}

      {/* Plans Modal */}
      <Modal open={showPlans} onClose={() => { setShowPlans(false); setSelectedSvc(null); }} title={selectedSvc?.name || 'Plans'} size="lg">
        <p className="text-sm text-muted-foreground dark:text-slate-300 mb-6">{selectedSvc?.description}</p>
        <div className="space-y-4">
          {svcPlans.map(plan => (
            <div key={plan.id} className="p-4 border border-border dark:border-dark-surface-3/60 rounded-xl hover:border-primary-300 dark:hover:border-primary-500/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">{plan.name}</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">{plan.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-blue-900 dark:text-blue-100">${plan.price.toFixed(2)}</span>
                  <p className="text-xs text-blue-600 dark:text-blue-300">/{plan.billing_cycle === 'monthly' ? 'mo' : plan.billing_cycle === 'annual' ? 'yr' : 'qtr'}</p>
                </div>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-1.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {plan.trial_days > 0 && <span>{plan.trial_days}-day free trial · </span>}
                  Up to {plan.max_users} user{plan.max_users > 1 ? 's' : ''}
                </div>
                <Button size="sm" onClick={() => handleSubscribe(plan)}>Subscribe Now</Button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
