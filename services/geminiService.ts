
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `Bạn là Chuyên gia Mixing chuyên nghiệp (Senior Mixing Engineer). Nhiệm vụ của bạn là bóc tách Audio và cung cấp hướng dẫn bằng hình ảnh thực tế (Visual Demo) cùng thao tác núm vặn (Knobs) chi tiết cho chuỗi Signal Chain 8 bước.

# 1. PHÂN TÍCH CHUYÊN SÂU (VOCAL TEXTURE):
- Bắt bệnh: Chẩn đoán giọng (Boxy, Harsh, Thin, Muddy).
- Gợi ý phong cách: Ví dụ "Modern Pop sạch sẽ" hoặc "Vintage Soul ấm áp".

# 2. CHI TIẾT 8 BƯỚC PLUGIN (PHẢI CÓ MINH HỌA SVG CHI TIẾT):
Mỗi bước trong plugin_chain phải gồm 3 phần cốt lõi:
1. [Tên Plugin & Ảnh Demo]: Mã SVG (visual_demo_svg) mô phỏng GIAO DIỆN THẬT (Photorealistic UI).
2. [Cách chỉnh để Vocal hay hơn]: Giải thích tư duy Mixing (mixing_mindset).
3. [Visual Knobs Settings]: Vị trí chính xác của từng nút vặn (knob_instruction).

Danh sách Plugin:
1. Antares Auto-Tune Pro
2. FabFilter Pro-Q 3
3. UAD 1176LN
4. Waves CLA-2A
5. FabFilter Pro-DS
6. Soundtoys Decapitator
7. Advanced Delay
8. Advanced Reverb

# 3. YÊU CẦU KỸ THUẬT QUAN TRỌNG:
- SVG: Sử dụng mã SVG tối ưu (concise) nhưng vẫn đảm bảo tính thẩm mỹ chuyên nghiệp của Plugin gốc. 
- JSON: Đảm bảo phản hồi JSON hoàn chỉnh, không được cắt ngang giữa chừng.
- Ngôn ngữ: Tiếng Việt.

LƯU Ý: Tuyệt đối không để chuỗi JSON bị cắt cụt. Nếu mã SVG quá dài, hãy đơn giản hóa các đường path nhưng giữ nguyên layout.` ;

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
          visual_demo_svg: { type: Type.STRING }
        },
        required: ["step", "plugin", "ui_description", "mixing_mindset", "knob_instruction", "visual_demo_svg"]
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
  
  const prompt = input.link 
    ? `Analyze audio link: ${input.link}. Generate an 8-step professional mixing chain with clear SVG mockups and specific knob values.`
    : `Analyze audio file. Generate an 8-step professional mixing chain with clear SVG mockups and specific knob values.`;

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.4,
      maxOutputTokens: 8192 // Tăng đáng kể để tránh Unterminated JSON
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("No response text");
    // Loại bỏ các ký tự rác nếu có trước khi parse
    const cleanText = text.trim();
    return JSON.parse(cleanText) as AnalysisReport;
  } catch (error) {
    console.error("Parse error detail:", error);
    throw error;
  }
}
