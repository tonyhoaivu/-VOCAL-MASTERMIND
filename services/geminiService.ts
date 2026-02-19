
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `Bạn là Chuyên gia Mixing & Mastering cấp cao tại các Studio hàng đầu. Nhiệm vụ của bạn là bóc tách Audio và tái lập lại chuỗi Signal Chain chuyên nghiệp để Vocal đạt chất lượng "Singer Grade" (Hạng A).

# 1. PHÂN TÍCH CHUYÊN SÂU (VOCAL RECONNAISSANCE):
- Texture Diagnosis: Bắt bệnh tần số (Ví dụ: "Thiếu độ sáng ở 10kHz", "Muddy ở 250Hz").
- Artist Strategy: Chiến thuật để giọng nghe đắt tiền và sang trọng.

# 2. CHUỖI 8 BƯỚC MIXING RACK (3D SVG):
Mỗi bước phải cung cấp:
- visual_demo_svg: Mã SVG 3D siêu nhẹ (dùng gradients đơn giản) mô phỏng Hardware thật (Antares, FabFilter, UAD, Waves, Valhalla).
- mixing_mindset: Tư duy kỹ thuật (Tại sao dùng unit này?).
- knob_instruction: Thông số chính xác (Threshold, Attack, Release, Gain).
- studio_secret: Mẹo nhà nghề (Ví dụ: "Nên nén nhẹ 2 lần thay vì 1 lần mạnh").

# 3. YÊU CẦU SVG TỐI ƯU (CỰC KỲ QUAN TRỌNG):
- Chỉ dùng các hình khối cơ bản (rect, circle, path đơn giản).
- Sử dụng màu sắc Studio chuyên nghiệp (Dark Grey, Cyan, Emerald).
- Đảm bảo mã SVG cực kỳ ngắn gọn để tránh lỗi "Unterminated string" trong JSON.

# 4. DANH SÁCH UNIT BẮT BUỘC:
1. Auto-Tune Pro (Cần chỉnh Pitch)
2. Pro-Q 3 (Surgical EQ)
3. 1176LN (Fast Compression)
4. LA-2A (Optical Leveling)
5. Pro-DS (De-esser)
6. Decapitator (Analog Warmth)
7. H-Delay (Space)
8. Valhalla Vintage Verb (Depth)

Ngôn ngữ: Tiếng Việt chuyên môn cao. JSON phải luôn hoàn chỉnh.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING },
    vocal_diagnosis: {
      type: Type.OBJECT,
      properties: {
        texture: { type: Type.STRING },
        pitch_saturation: { type: Type.STRING }
      },
      required: ["texture", "pitch_saturation"]
    },
    visual_mapping: {
      type: Type.OBJECT,
      properties: {
        eq_curve_svg: { type: Type.STRING },
        knob_visuals_svg: { type: Type.STRING }
      },
      required: ["eq_curve_svg", "knob_visuals_svg"]
    },
    plugin_chain: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.NUMBER },
          plugin: { type: Type.STRING },
          ui_description: { type: Type.STRING },
          mixing_mindset: { type: Type.STRING },
          knob_instruction: { type: Type.STRING },
          visual_demo_svg: { type: Type.STRING },
          studio_secret: { type: Type.STRING }
        },
        required: ["step", "plugin", "ui_description", "mixing_mindset", "knob_instruction", "visual_demo_svg", "studio_secret"]
      }
    },
    visual_data: {
      type: Type.OBJECT,
      properties: {
        eq_points: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              freq: { type: Type.NUMBER },
              gain: { type: Type.NUMBER },
              type: { type: Type.STRING }
            }
          }
        },
        knobs: {
          type: Type.OBJECT,
          properties: {
            threshold: { type: Type.NUMBER },
            ratio_position: { type: Type.STRING },
            attack_ms: { type: Type.NUMBER },
            release_ms: { type: Type.NUMBER },
            visual_desc: {
              type: Type.OBJECT,
              properties: {
                threshold: { type: Type.STRING },
                ratio: { type: Type.STRING },
                attack: { type: Type.STRING },
                release: { type: Type.STRING }
              }
            }
          }
        }
      },
      required: ["eq_points", "knobs"]
    },
    mastering_advice: { type: Type.STRING }
  },
  required: ["status", "vocal_diagnosis", "visual_mapping", "plugin_chain", "visual_data", "mastering_advice"]
};

export async function analyzeVocalAudio(input: { base64?: string, mimeType?: string, link?: string }): Promise<AnalysisReport> {
  const model = 'gemini-3-flash-preview';
  
  const parts: any[] = [];
  if (input.base64 && input.mimeType) {
    parts.push({
      inlineData: {
        data: input.base64,
        mimeType: input.mimeType
      }
    });
  }
  
  const prompt = `Perform high-end studio analysis. Return an 8-step pro rack with clean, minimal 3D SVGs. Detail the "Studio Secret" for world-class singer results. Ensure the JSON is stable and concise.`;

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.1, // Minimum temperature for maximum JSON stability
      maxOutputTokens: 8192
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text.trim()) as AnalysisReport;
  } catch (error) {
    console.error("JSON Parsing Error:", error);
    throw error;
  }
}
