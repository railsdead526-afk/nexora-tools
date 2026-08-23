-- 009: Remove all NexoraAI / AI chat / RAG knowledge base artifacts.
--
-- NexoraAI telah dihapus dari aplikasi. Migration ini membersihkan objek database
-- yang hanya dipakai fitur tersebut: tabel percakapan AI, tabel knowledge base RAG,
-- fungsi pendukung, dan storage bucket `knowledge-base`.
--
-- PERINGATAN: menjalankan migration ini MENGHAPUS PERMANEN riwayat chat AI dan
-- seluruh dokumen knowledge base. Pastikan tidak ada data yang masih dibutuhkan.
-- Jalankan di Supabase SQL Editor seperti migration lainnya.

-- Percakapan AI (ai_messages ikut terhapus via cascade dari ai_conversations).
drop table if exists public.ai_conversations cascade;

-- Knowledge base RAG (knowledge_chunks ikut terhapus via cascade dari knowledge_documents).
drop table if exists public.knowledge_documents cascade;

-- Fungsi khusus NexoraAI/RAG.
drop function if exists public.touch_ai_conversation_updated_at();
drop function if exists public.match_knowledge_chunks(vector, integer);

-- Storage bucket knowledge base beserta seluruh isinya.
delete from storage.objects where bucket_id = 'knowledge-base';
delete from storage.buckets where id = 'knowledge-base';

-- Catatan: public.set_row_updated_at() (dibuat di 006) TIDAK dihapus karena
-- merupakan utilitas trigger generik yang aman dipakai tabel lain di masa depan.
