'use client';
import {signOut} from 'next-auth/react';

export default function LogoutButton({className='btn'}:{className?:string}){
  return <button className={className} type="button" onClick={()=>void signOut({callbackUrl:'/'})}>Logout</button>;
}
