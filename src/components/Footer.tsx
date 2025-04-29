import React from "react";
import Logo from "./Logo";

const Footer: React.FC = () => (
  <footer className="py-8 px-4 bg-black border-t border-zinc-800">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
      <Logo size="sm" />
      <div className="text-zinc-500 text-sm mt-4 md:mt-0 text-center md:text-right">
        <p>&copy; {new Date().getFullYear()} Quick-Tok. All rights reserved.</p>
        <p className="mt-1">
          Powered by Creatomate, Lemon Slice, and OpenAI.
        </p>
        <p className="mt-1">
          Email <a href="mailto:contact@quick-tok.com" className="underline text-quicktok-orange">contact@quick-tok.com</a> for any questions or inquiries.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer; 