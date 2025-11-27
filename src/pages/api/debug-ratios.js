import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  try {
    // Get all aspect ratios from completed generations
    const { data, error } = await supabase
      .from('generations')
      .select('aspect_ratio, username, prompt')
      .eq('status', 'completed')
      .not('aspect_ratio', 'is', null)
      .not('result_image_url', 'is', null)
      .limit(100);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    // Count aspect ratios
    const ratioCount = {};
    const ratioExamples = {};
    
    data.forEach(item => {
      const ratio = item.aspect_ratio;
      ratioCount[ratio] = (ratioCount[ratio] || 0) + 1;
      
      if (!ratioExamples[ratio]) {
        ratioExamples[ratio] = {
          username: item.username,
          prompt: item.prompt.substring(0, 50) + '...'
        };
      }
    });

    // Sort by count
    const sortedRatios = Object.entries(ratioCount)
      .sort(([,a], [,b]) => b - a)
      .map(([ratio, count]) => ({
        ratio,
        count,
        example: ratioExamples[ratio],
        // Calculate numerical ratio for analysis
        numerical: (() => {
          const [w, h] = ratio.split(':').map(Number);
          return w && h ? (w / h).toFixed(3) : 'invalid';
        })(),
        // Classify 
        classification: (() => {
          const [w, h] = ratio.split(':').map(Number);
          if (!w || !h) return 'invalid';
          const r = w / h;
          if (r >= 1.4) return 'landscape';
          if (r <= 0.7) return 'portrait';
          return 'square/neutral';
        })()
      }));

    res.status(200).json({
      totalImages: data.length,
      uniqueRatios: Object.keys(ratioCount).length,
      ratios: sortedRatios
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}