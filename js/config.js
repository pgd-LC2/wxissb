/**
 * Supabase 配置文件
 * 
 * 注意：这里的 API 密钥是公开的客户端密钥（anon key），设计上可以安全地暴露在前端代码中。
 * 数据安全通过 Row Level Security (RLS) 策略来保护，而不是通过隐藏此密钥。
 * 参考：https://supabase.com/docs/guides/api#api-keys
 */

window.SUPABASE_CONFIG = {
  url: 'https://dhlvrnpjcggtxtarpdhf.supabase.co',
  // Public client key - security is enforced via RLS policies
  publicKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobHZybnBqY2dndHh0YXJwZGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Nzg5MDQsImV4cCI6MjA4NDA1NDkwNH0.0XE6QcZBoB0tfqmt_-7BJw2doTR8e6vEypEDYNB8DfE'
};
