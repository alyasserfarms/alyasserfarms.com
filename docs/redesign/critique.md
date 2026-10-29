# مراجعة إعادة التصميم

تقييم ذاتي للمقارنة بين الجولات، لا يمثل موافقة المستخدم أو حكمًا مستقلًا على الإبداع.

ROUND 1
Seen in one second: خط رقعة عربي كبير بجوار نافذة نخيل مقوّسة.
Idea (one sentence): يتحول قوس المشهد الزراعي في الشعار إلى باب تفتح منه حكاية الخير.
Live thing: المرور والتركيز على الفئات يغيّر الصورة، والاختيار يفلتر المنتجات.
Layout words by section: hero=gate / about=collage / categories=interactive-index / products=panorama-and-pair / story=held-poster / films=cinema / delivery=verbs / season=photographic-print / footer=wordmark
Scores: design 8 · usability 7 · creativity 7 · content 6 → overall 6.0
Caps applied: فشلا eyebrow وui-wrapper في التقرير الآلي يحدان التقييم إلى 6.0، رغم تحسن التكوين.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. زر الفيديو يقع خلف الطبعة الصغيرة: `.taste-skill/redesign-round-1/mobile-fold.jpg` وdesktop-fold. نُقل إلى الطرف المقابل.
2. صورة الخضروات تتكرر في التعريف والفئات والمنتج والقصة: desktop-page-01/02. أضيفت صورتا harvest وbasket مرخصتان، واستُبدلت لقطة السوق الصغيرة بسلة أقرب للاتجاه.
3. صندوق data-ui يشمل عرض منتجات أطول من شاشة ونصف: تقرير round-1. نُقل الوسم إلى المنتج المفرد، وأصبح رابط التوصيل بعد الخطوات بدل جلوسه فوق عنوان خطوة.

ROUND 2
Seen in one second: الخط العربي هو الكتلة الأولى، ثم نافذة تصوير طبيعية مضيئة.
Idea (one sentence): بوابة الخير تقابل دفء المائدة من خلال صور تتغير مع الاختيار والتمرير.
Live thing: الفئات تعمل بالمرور والتركيز والنقر، والبحث والسلة متصلان بالكتالوج.
Layout words by section: hero=gate / about=collage / categories=interactive-index / products=panorama-and-pair / story=held-poster / films=cinema / delivery=verbs / season=photographic-print / footer=wordmark
Scores: design 8 · usability 8 · creativity 7 · content 6 → overall 6.0
Caps applied: التقرير التقط رابط «افتح باب الحكاية» فوق العنوان التالي على الجوال كـ eyebrow. أزيل الرابط الثانوي، وبقي فعل المتجر الأساسي.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. أهداف أيقونات التنقل تنخفض إلى 40px عند 320: check-redesign. صارت 44px في القاعدة المشتركة، دون انزلاق أفقي.
2. رابط تمرير زائد يزيد ارتفاع الافتتاحية ويجاور عنوان القسم التالي: mobile-fold. أزيل.
3. تعليق صورة التعريف يصل خلف الصورة الصغيرة: mobile-page-01. حُصر التعليق في النصف المقابل لها، مع مراجعة مباشرة عند 320 و390.

ROUND 3
Seen in one second: وعد «الخير له أصل» بخط عربي تعبيري، نافذة نخيل، وتفصيل سلة مصورة.
Idea (one sentence): باب مستمد من هوية المزارع يقود من المشهد الزراعي إلى اختيار المائدة.
Live thing: معاينة الفئات ثم فلترتها، بحث وإضافة للسلة، ومشهد أرض/مائدة يتبدل مع التمرير الطبيعي.
Layout words by section: hero=gate / about=collage / categories=interactive-index / products=panorama-and-pair / story=held-poster / films=cinema / delivery=verbs / season=photographic-print / footer=wordmark
Scores: design 8 · usability 8 · creativity 7 · content 6 → overall 7.6
Caps applied: الإبداع ≤7 لأن البوابة والتكوين المثبت أسلوبان يمكن تطبيقهما على منافس؛ لا ادعاء بتفرّد مطلق. المحتوى 6 بسبب الاعتماد على تصوير تمثيلي بدل أرشيف المزارع.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. احتمال تقارب الطبعة الصغيرة مع زر الفيديو الأطول عند إيقافه على هاتف ضيق: hero-320. رُفعت الطبعة وجرى اختبار انفصال الحدود على المقاسات الأربعة.
2. تعليق الصورة المتداخلة في التعريف: intro-390 وintro-320. المعالجة النهائية تخصّص له النصف الأيمن؛ فُحص الفصل الهندسي والصورة الفعلية.
3. المقطع الطبيعي نفسه مستخدم في الافتتاحية وقسم الأفلام، والصور لا توثق المزارع: desktop-page-03. بقي الإفصاح والمصادر ظاهرين؛ تصوير العميل المختلف للمكان والمنتجات هو الأصل المطلوب قبل الإطلاق.

التقرير الخام الأخير: `.taste-skill/redesign-final/report.json`، صفر FAIL وخمسة WARN. بعده أُجري ضبط موضعي لتعليق التعريف وموقع الطبعة على الجوال، ثم أعيد اختبار الواجهات المتأثرة مباشرة.

تفسير التحذيرات: العاجي لون العميل المعتمد؛ تعدد الأحجام ناتج عن العرض العربي التعبيري والواجهة والمعلومات الصغيرة؛ وصف المتجر ظاهر فعليًا بحجم 18px تحت العنوان لكن مقياس النص يقسمه عند br؛ قياس الحواف اليسرى لا يصف محاذاة العربية إلى اليمين؛ والعنوان المثبت مقصود فوق صور مغطاة بستار لوني يضمن تباينًا لا يقل عن 5.30:1 حتى مع أسطع بكسل ممكن. لم تُخفَ هذه التحذيرات أو تُبدّل قواعد الفاحص.
