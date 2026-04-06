"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCustomers, fetchReturning } from "@/lib/analytics-api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const COLORS = ['var(--primary)', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export default function AnalyticsCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [returning, setReturning] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const [custRes, retRes] = await Promise.all([
          fetchCustomers(),
          fetchReturning()
        ]);
        setCustomers(Array.isArray(custRes) ? custRes : []);
        setReturning(retRes);
      } catch (err) {
        console.error("Failed to load customers", err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const topSpendersData = [...customers].sort((a, b) => b.total_spent - a.total_spent).slice(0, 10).map(c => ({
     name: `Cust #${c._id}`,
     spent: c.total_spent,
     bookings: c.total_bookings
  }));

  const retentionData = returning ? [
     { name: 'New Customers', value: returning.new_customers || 0 },
     { name: 'Returning', value: returning.returning_customers || 0 }
  ] : [];

  return (
    <div className="space-y-6">
      <div>
         <h2 className="text-2xl font-bold tracking-tight text-white">Customer Insights</h2>
         <p className="text-zinc-400">Analyze individual customer spending behavior.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader>
             <CardTitle>Top Spenders (Total Spent)</CardTitle>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="h-[300px] flex items-center justify-center text-zinc-500">Loading chart...</div>
             ) : topSpendersData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSpendersData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(val) => `$${val}`} />
                      <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} width={80} />
                      <Tooltip 
                         cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                         contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                         itemStyle={{ color: 'var(--primary)' }}
                      />
                      <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={20}>
                         {topSpendersData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             ) : (
                <div className="h-[300px] flex items-center justify-center text-zinc-500 text-sm">No spender data available</div>
             )}
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader>
             <CardTitle>Retention Ratio</CardTitle>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="h-[300px] flex items-center justify-center text-zinc-500">Loading ratio...</div>
             ) : retentionData.length > 0 && retentionData.some(d => d.value > 0) ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={retentionData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {retentionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : 'var(--primary)'} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                         itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             ) : (
                <div className="h-[300px] flex items-center justify-center text-zinc-500 text-sm">No retention data available</div>
             )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
         <CardHeader>
           <CardTitle>Spender Ledger</CardTitle>
         </CardHeader>
         <CardContent>
            {loading ? (
               <div className="h-[200px] flex items-center justify-center text-zinc-500">Loading customers...</div>
            ) : (
               <div className="relative w-full overflow-auto">
                 <table className="w-full caption-bottom text-sm text-left">
                   <thead className="[&_tr]:border-b [&_tr]:border-zinc-800">
                     <tr className="border-b transition-colors hover:bg-white/5 data-[state=selected]:bg-zinc-800">
                       <th className="h-10 px-4 align-middle font-medium text-zinc-400">Customer ID</th>
                       <th className="h-10 px-4 align-middle font-medium text-zinc-400">Total Bookings</th>
                       <th className="h-10 px-4 align-middle font-medium text-zinc-400 text-right">Total Spent</th>
                     </tr>
                   </thead>
                   <tbody className="[&_tr:last-child]:border-0">
                     {[...customers].sort((a, b) => b.total_spent - a.total_spent).map((customer) => (
                       <tr key={customer._id} className="border-b border-zinc-800 transition-colors hover:bg-white/5">
                         <td className="p-4 align-middle font-medium">#{customer._id}</td>
                         <td className="p-4 align-middle">{customer.total_bookings} tickets</td>
                         <td className="p-4 align-middle text-right font-bold text-[color:var(--primary)]">{formatCurrency(customer.total_spent)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {customers.length === 0 && <div className="text-center py-6 text-zinc-500">No customers found</div>}
               </div>
            )}
         </CardContent>
      </Card>
    </div>
  );
}
