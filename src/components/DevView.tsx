import React, { useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-tomorrow.css';
import { Play, Save, Smartphone, Code, Layout, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

export const DevView: React.FC = () => {
  const [xmlCode, setXmlCode] = useState(`<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="#FFFFFF">

    <TextView
        android:id="@+id/welcome_text"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Welcome to SoundsOn Dev!"
        android:textSize="24sp"
        android:textColor="#FF0000"
        android:textStyle="bold" />

    <Button
        android:id="@+id/action_button"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="24dp"
        android:text="Click Me"
        android:background="#000000"
        android:textColor="#FFFFFF" />

</LinearLayout>`);

  const [javaCode, setJavaCode] = useState(`package com.soundson.app;

import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button button = findViewById(R.id.action_button);
        button.setOnClickListener(v -> {
            Toast.makeText(this, "Button Clicked!", Toast.LENGTH_SHORT).show();
        });
    }
}`);

  const [activeTab, setActiveTab] = useState<'xml' | 'java' | 'preview'>('xml');

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-white overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900">
        <div className="flex items-center gap-2">
          <Code className="text-brand-red" size={20} />
          <h2 className="font-bold text-lg">DroidStudio Mobile</h2>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-colors">
            <Play size={16} fill="currentColor" />
            Run
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Save size={20} />
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/10 bg-zinc-900">
        <button 
          onClick={() => setActiveTab('xml')}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'xml' ? 'border-brand-red text-white' : 'border-transparent text-white/50'}`}
        >
          activity_main.xml
        </button>
        <button 
          onClick={() => setActiveTab('java')}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'java' ? 'border-brand-red text-white' : 'border-transparent text-white/50'}`}
        >
          MainActivity.java
        </button>
        <button 
          onClick={() => setActiveTab('preview')}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'preview' ? 'border-brand-red text-white' : 'border-transparent text-white/50'}`}
        >
          Preview
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {activeTab === 'xml' && (
          <Editor
            value={xmlCode}
            onValueChange={code => setXmlCode(code)}
            highlight={code => highlight(code, languages.markup, 'markup')}
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 14,
              backgroundColor: 'transparent',
              minHeight: '100%',
            }}
            className="outline-none"
          />
        )}
        {activeTab === 'java' && (
          <Editor
            value={javaCode}
            onValueChange={code => setJavaCode(code)}
            highlight={code => highlight(code, languages.javascript, 'javascript')}
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 14,
              backgroundColor: 'transparent',
              minHeight: '100%',
            }}
            className="outline-none"
          />
        )}
        {activeTab === 'preview' && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="w-[300px] h-[600px] bg-white rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="h-6 bg-zinc-800 w-1/3 mx-auto rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2 z-10"></div>
              <div className="flex-1 p-6 flex flex-col text-black">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Welcome to SoundsOn Dev!</h1>
                <p className="text-zinc-500 mb-8">This is a live preview of your Android layout.</p>
                <button className="mt-auto bg-black text-white py-3 rounded-lg font-bold shadow-lg active:scale-95 transition-transform">
                  Click Me
                </button>
              </div>
              <div className="h-1 bg-zinc-300 w-1/3 mx-auto rounded-full mb-2"></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border-t border-white/10 p-2 flex items-center gap-4 text-[10px] text-white/50 uppercase font-bold tracking-wider">
        <div className="flex items-center gap-1">
          <Terminal size={12} />
          Terminal
        </div>
        <div className="flex items-center gap-1">
          <Layout size={12} />
          Layout Inspector
        </div>
        <div className="flex items-center gap-1">
          <Smartphone size={12} />
          Logcat
        </div>
      </div>
    </div>
  );
};
