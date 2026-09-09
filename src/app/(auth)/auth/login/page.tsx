'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.globalRole === 'SUPER_ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push(`/${data.shopSlug}/dashboard`);
        }
      } else {
        setError('로그인 실패. 이메일이나 비밀번호를 확인하세요.');
      }
    } catch {
      setError('서버 오류가 발생했습니다.');
    }
  };

  const quickLogin = async (qEmail: string, qPassword: string) => {
    setEmail(qEmail);
    setPassword(qPassword);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: qEmail, password: qPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.globalRole === 'SUPER_ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push(`/${data.shopSlug}/dashboard`);
        }
      } else {
        setError('로그인 실패.');
      }
    } catch {
      setError('서버 오류가 발생했습니다.');
    }
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>BeautyM 로그인</CardTitle>
        <CardDescription>관리자 또는 직원 계정으로 로그인하세요.</CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="text-sm text-slate-500 mt-4">
            <p>데모 계정:</p>
            <p>admin@beautym.com / admin1234</p>
            <p>owner@demo.com / owner1234</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">로그인</Button>
          <div className="w-full">
            <p className="text-xs text-center text-slate-400 mb-2">간편 로그인</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => quickLogin('admin@beautym.com', 'admin1234')}
              >
                🛡️ Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => quickLogin('owner@demo.com', 'owner1234')}
              >
                👩‍💼 Owner
              </Button>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
