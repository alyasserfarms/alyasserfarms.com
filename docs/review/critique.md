ROUND 1
Seen in one second: عنوان «الخير له أصل» ومشهد نخيل واسع، مع فعل شراء واضح.
Idea (one sentence): شعار الخير له أصل يتحول إلى رحلة من الطبيعة إلى تكوين المائدة.
Live thing: اختيار الفئة والبحث وإضافة منتجات تجريبية لسلة قابلة لتعديل الكميات.
Layout words by section: hero=landscape / about=letter / categories=staggered-strip / products=asymmetric-catalogue / story=colour-field / film=screen-and-caption / delivery=sequence / season=harvest-panel / footer=wordmark
Scores: design 7.5 · usability 7 · creativity 7 · content 7 → overall 6.0
Caps applied: فشل أداة الفحص الأولى يجعل الحد الأقصى 6.0. صور توضيحية وبيانات عرض، دون أصول عميل حتى الآن؛ لا ادعاء بتميّز حصري مبني على أصول غير موجودة.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. mobile-page-01.jpg: خلفية زر فيديو المشاهد تمتد رأسيًا فوق الصورة. إصلاح التموضع والحجم الثابت بدل inset مع height:auto.
2. desktop-page-01.jpg وmobile-page-01.jpg: بيانات الوحدات والأسعار والملاحظات صغيرة مقارنة بالأسماء. رفع النصوص المقروءة إلى 16px وتبسيط الفروق.
3. desktop-fold.jpg: طبقات الافتتاحية تجعل العنوان غير قابل للتحديد رغم ظهوره؛ تصحيح pointer-events وتسلسل الطبقات. تحويل دخول الأقسام إلى حركة CSS قابلة للرصد وتحترم تقليل الحركة، مع بقاء المحتوى ظاهرًا دون JavaScript.

ROUND 2
Seen in one second: عنوان واضح على نخيل طبيعي، وفعل شراء واضح.
Idea (one sentence): رحلة من الأرض إلى المائدة بألوان الحصاد وتكوينات تحريرية مختلفة.
Live thing: تصفية كتالوج وسلة معاينة قابلة للتعديل.
Layout words by section: hero=landscape / about=letter / categories=staggered-strip / products=asymmetric-catalogue / story=colour-field / film=screen-and-caption / delivery=sequence / season=harvest-panel / footer=wordmark
Scores: design 7.5 · usability 8 · creativity 7 · content 7 → overall 7.5
Caps applied: لا أخطاء مانعة. سقف الإبداع 7 لأن متجرًا زراعيًا آخر قد يستخدم فكرة أرض/مائدة أيضًا.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. mobile-fold.jpg: وصف المتجر أصغر مما ينبغي؛ توضيح كلمة متجر ورفع الوصف إلى 18px على الجوال.
2. desktop-fold.jpg: تحكم الفيديو يبدو باهتًا تحت التعتيم؛ تصحيح التكديس ورفع التعتيم إلى 64% لضمان قراءة النص.
3. desktop-page-01.jpg: أحجام الخط كثيرة؛ توحيد أدوار النص والعناوين، وتحسين مؤشر التركيز والإيقاف اليدوي للفيديو.

ROUND 3
Seen in one second: «الخير له أصل» فوق نخيل طبيعي، مع شعار العميل وفعل اكتشاف واضح.
Idea (one sentence): الأرض والمائدة طرفا رحلة واحدة، يربطها شعار العميل وتكوين تحريري من خيرات المزرعة.
Live thing: بحث واختيار فئة وإضافة منتجات وتعديل كميات وحذف من سلة المعاينة.
Layout words by section: hero=landscape / about=letter / categories=staggered-strip / products=asymmetric-catalogue / story=colour-field / film=screen-and-caption / delivery=sequence / season=harvest-panel / footer=wordmark
Scores: design 8 · usability 8 · creativity 7 · content 7 → overall 7.7
Caps applied: سقف الإبداع 7 بسبب قابلية نقل جزء من الفكرة والصور لمتجر زراعي آخر. تصوير العميل ومحتواه الفعليان سيساعدان على تعميق الخصوصية.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. desktop-page-01.jpg: صور المنتجات تمثيلية ومختلفة الإضاءة؛ يلزم تصوير العميل المعتمد بدل اختراع صور خاصة به.
2. mobile-page-01.jpg: طول عرض الفئات والمنتجات يحتاج إعادة تقييم بعد اعتماد الكتالوج؛ أبقيت الفئات الست متاحة دون سحب أفقي إلزامي.
3. desktop-fold.jpg: غياب الشعار في البداية عولج بعد وصول ملفات العميل أثناء المراجعة؛ اختير الأصل الأساسي 01_ دون تعديل، ثم أعيد فحص تحميله ومقاساته.

## تفسير التحذيرات المتبقية

- `palette-cream`: العاجي `#F6F1E7` لون معتمد من المستخدم. أُبقي عمدًا مع تباين أخضر/عاجي 10.71:1.
- `ragged-edges`: المقياس يتتبع بدايات النص من اليسار بينما الواجهة RTL بمحاذاة البداية من اليمين؛ تُظهر اللقطات هوامش متساوية ومحاذاة يمينية داخل أعمدة الشبكة، لذلك أُبقي التكوين بعد المراجعة.
