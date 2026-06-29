-- Seed data for Supabase
-- Run this in the Supabase SQL Editor after creating the tables

-- Seed categories
INSERT INTO public.categories (id, name_fa, icon, "order") VALUES
  ('cat-1', 'همه', '✦', 0),
  ('cat-2', 'قهوه‌های گرم', '☕', 1),
  ('cat-3', 'نوشیدنی‌های سرد', '🧊', 2),
  ('cat-4', 'چای و دمنوش', '🍵', 3),
  ('cat-5', 'دسرها', '🍰', 4),
  ('cat-6', 'صبحانه', '🥐', 5),
  ('cat-7', 'غذاهای سبک', '🥗', 6)
ON CONFLICT (id) DO NOTHING;

-- Seed cafe info
INSERT INTO public.cafe_info (id, name, tagline, phone, address_fa, instagram, telegram, hours_fa, about_fa, welcome_fa)
VALUES (
  'singleton',
  'کافه آی‌چای',
  'تجربه‌ای ناب از طعم و آرامش',
  '۰۲۱-۸۸۷۷۶۶۵۵',
  'تهران، خیابان ولیعصر، نبش کوچه گلستان، پلاک ۱۲۰',
  '@aichai_cafe',
  '@aichai_cafe',
  'هر روز از ساعت ۸ صبح تا ۱۲ شب',
  'کافه آی‌چای با هدف خلق فضایی آرام و دل‌نشین در قلب تهران تأسیس شده است. ما با بهترین دانه‌های قهوه از سراسر جهان و تازه‌ترین مواد اولیه، تجربه‌ای متفاوت از طعم و کیفیت را برای شما به ارمغان می‌آوریم. فضای گرم و صمیمی کافه، همراه با موسیقی ملایم و سرویس حرفه‌ای، مکانی ایده‌آل برای دورهمی‌های دوستانه، جلسات کاری و لحظات آرام شماست.',
  'به کافه آی‌چای خوش آمدید'
)
ON CONFLICT (id) DO NOTHING;

-- Seed products
INSERT INTO public.products (id, category_id, name_fa, description_fa, price, image_url, is_featured, "order") VALUES
  ('prod-1', 'cat-2', 'اسپرسو', 'عصاره خالص قهوه با طعمی غلیظ و عطری بی‌نظیر', 85000, 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&q=80', true, 1),
  ('prod-2', 'cat-2', 'لاته', 'ترکیب لطیف اسپرسو با شیر بخار‌خورده و فوم مخملی', 125000, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80', true, 2),
  ('prod-3', 'cat-2', 'کاپوچینو', 'اسپرسو با شیر فوم‌گرفته و پودر دارچین', 115000, 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&q=80', false, 3),
  ('prod-4', 'cat-2', 'آمریکانو', 'اسپرسو رقیق با آب داغ، مناسب برای عاشقان قهوه خالص', 95000, 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=400&q=80', false, 4),
  ('prod-5', 'cat-2', 'موکا', 'ترکیب شکلات تلخ با اسپرسو و شیر بخار‌خورده', 135000, 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&q=80', true, 5),
  ('prod-6', 'cat-2', 'قهوه ترک', 'قهوه سنتی ترک با طعمی ماندگار و عطری دل‌انگیز', 105000, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80', false, 6),
  ('prod-7', 'cat-3', 'آیس لاته', 'لاته سرد با یخ، مناسب روزهای گرم تابستان', 130000, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', false, 7),
  ('prod-8', 'cat-3', 'فراپوچینو', 'نوشیدنی یخی قهوه با خامه و سس شکلات', 145000, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80', true, 8),
  ('prod-9', 'cat-3', 'آبمیوه طبیعی', 'آبمیوه تازه فصل، بدون افزودنی و شکر', 95000, 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&q=80', false, 9),
  ('prod-10', 'cat-3', 'اسموتی میوه', 'ترکیب میوه‌های تازه با ماست و عسل طبیعی', 140000, 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&q=80', false, 10),
  ('prod-11', 'cat-4', 'چای سیاه', 'چای اصیل ایرانی با عطر بهارنارنج', 65000, 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400&q=80', false, 11),
  ('prod-12', 'cat-4', 'دمنوش بابونه', 'آرامش‌بخش و مناسب برای رفع خستگی روزانه', 75000, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80', false, 12),
  ('prod-13', 'cat-4', 'چای ماسالا', 'چای هندی با ادویه‌های معطر و شیر بخار‌خورده', 110000, 'https://images.unsplash.com/photo-1593527141222-ee3e83766b2f?w=400&q=80', true, 13),
  ('prod-14', 'cat-5', 'تیرامیسو', 'دسر ایتالیایی با قهوه اسپرسو و پنیر ماسکارپونه', 155000, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80', true, 14),
  ('prod-15', 'cat-5', 'چیزکیک', 'کیک پنیری نرم با سس توت‌فرنگی تازه', 145000, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80', false, 15),
  ('prod-16', 'cat-5', 'براونی شکلاتی', 'براونی تازه با مغز گردو و سس شکلات تلخ', 125000, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=80', false, 16),
  ('prod-17', 'cat-6', 'صبحانه انگلیسی', 'تخم‌مرغ، بیکن، لوبیا، نان تست و سبزیجات تازه', 245000, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80', true, 17),
  ('prod-18', 'cat-6', 'پنکیک', 'پنکیک نرم با شیره افرا و میوه‌های تازه فصل', 175000, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80', false, 18),
  ('prod-19', 'cat-7', 'سالاد سزار', 'کاهو رومی، مرغ گریل، پارمزان و سس سزار مخصوص', 195000, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80', false, 19),
  ('prod-20', 'cat-7', 'ساندویچ کلاب', 'نان تست با مرغ، بیکن، آووکادو و سبزیجات تازه', 215000, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80', false, 20)
ON CONFLICT (id) DO NOTHING;
