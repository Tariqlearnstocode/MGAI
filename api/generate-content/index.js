// Vercel Serverless Function for OpenAI Content Generation
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import cors from 'micro-cors';

// Setup CORS for the API endpoint
const corsMiddleware = cors({
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client for usage tracking (optional)
const supabase = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY 
  ? createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
  : null;

async function generateContentHandler(req, res) {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model = process.env.OPENAI_MODEL || 'gpt-4o-mini', max_tokens } = req.body;

    // Validate the required parameters
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`Generating content with model: ${model}`);

    // Configure the completion options
    const completionOptions = {
      model: model,
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: max_tokens || undefined,
    };

    // Call OpenAI API
    console.log("Calling OpenAI with options:", JSON.stringify(completionOptions, null, 2));
    const completion = await openai.chat.completions.create(completionOptions);
    console.log("OpenAI response received with tokens:", completion.usage);

    // Log usage to Supabase if available (optional)
    if (supabase) {
      try {
        await supabase.from('api_usage').insert({
          model: model,
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
          prompt_snippet: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
        });
      } catch (error) {
        console.error('Error logging API usage to Supabase:', error);
        // Non-critical error, continue with the response
      }
    }

    // Extract and return the generated content
    return res.status(200).json({
      result: completion.choices[0].message.content,
      usage: completion.usage
    });
  } catch (error) {
    console.error('Error generating content with OpenAI:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate content'
    });
  }
}

// Apply CORS middleware to the handler
export default corsMiddleware(generateContentHandler);
