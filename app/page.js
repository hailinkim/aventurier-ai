'use client';
// import LoginForm from '@/components/LoginForm';
import Link from 'next/link';
export default async function Home() {
  const response = await fetch('api/python');
  const data = await response.text();
  return (
      // <LoginForm/>
      data
  );
}