'use client';
// import LoginForm from '@/components/LoginForm';
import Link from 'next/link';
export default async function Home() {
  const response = await fetch('http://127.0.0.1:5328/api/python');
  const data = await response.text();
  return (
      // <LoginForm/>
      data
  );
}