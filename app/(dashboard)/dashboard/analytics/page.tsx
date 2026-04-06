"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchConversion, fetchTrends, fetchCustomers, fetchReturning } from "@/lib/analytics-api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        // Call the Go endpoints in parallel
        const [conversionRes, trendsRes, customersRes, returningRes] = await Promise.all([
           fetchConversion(),
           fetchTrends(),
           fetchCustomers(),
           fetchReturning()
        ]);

        setData({
          conversion: conversionRes,
          trends: trendsRes,
          customers: customersRes,
          returning: returningRes
        });
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="text-zinc-400 p-6 flex items-center justify-center h-[50vh]">Loading live metrics from Go service...</div>;
  }

  if (error) {
    return <div className="text-red-400 p-6 bg-red-950/20 rounded-xl border border-red-900/50">Error: {error}</div>;
  }

  // --- Map the Go Response Data Payload ---
  // Conversion
  const conversionRate = data?.conversion?.conversion_rate ?? 0;
  const totalBookings = data?.conversion?.total_bookings ?? 0;
  
  // Trends (Summing Total Revenue)
  const trendsList: any[] = Array.isArray(data?.trends) ? data.trends : [];
  const totalRevenue = trendsList.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
  
  // Group by date for Graph
  const dateMap = new Map<string, number>();
  trendsList.forEach(item => {
     const date = item._id?.date;
     if (date) {
        const current = dateMap.get(date) || 0;
        dateMap.set(date, current + (item.total_revenue || 0));
     }
  });
  
  const chartData = Array.from(dateMap.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, revenue]) => ({ date, revenue }));

  // Re-group trends to extract distinct movies & format dates
  const movieMap = new Map<number, { title: string, revenue: number }>();
  trendsList.forEach(item => {
     let movieTitle = "Unknown";
     try {
       const parsedData = JSON.parse(item.title);
       movieTitle = parsedData.en || parsedData;
     } catch {
       movieTitle = item.title;
     }
     const movieId = item._id?.movie_id;
     if (movieId) {
        if (!movieMap.has(movieId)) {
           movieMap.set(movieId, { title: movieTitle, revenue: 0 });
        }
        movieMap.get(movieId)!.revenue += item.total_revenue || 0;
     }
  });
  const topMovies = Array.from(movieMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Returning
  const newCustomers = data?.returning?.new_customers ?? 0;
  const returningCustomers = data?.returning?.returning_customers ?? 0;
  const totalCustomers = newCustomers + returningCustomers;

  // Render Formatters
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[color:var(--primary)]">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Customer Base</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{totalCustomers}</div>
             <p className="text-xs text-zinc-500">{returningCustomers} returning, {newCustomers} new</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
         <Card className="col-span-4 bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader>
              <CardTitle>Daily Trends</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="h-[300px] w-full">
                 {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                           itemStyle={{ color: 'var(--primary)' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="flex h-full items-center justify-center text-zinc-500 text-sm">No trend data available</div>
                 )}
               </div>
            </CardContent>
         </Card>
         <Card className="col-span-3 bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader>
              <CardTitle>Top Performing Movies</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {topMovies.length > 0 ? topMovies.map((movie, i) => (
                     <div key={i} className="flex items-center justify-between border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                        <span className="font-medium text-zinc-200">{movie.title}</span>
                        <span className="font-bold text-[color:var(--primary)]">{formatCurrency(movie.revenue)}</span>
                     </div>
                  )) : (
                     <div className="text-zinc-500 text-sm py-4 text-center">No movies to list</div>
                  )}
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
