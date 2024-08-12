'use client';
// import LoginForm from '@/components/LoginForm';
import Link from 'next/link';
export default async function Home() {
  const response = await fetch('http://localhost:3000/api/python');
  const data = await response.text();
  return (
      // <LoginForm/>
      data
  );
}