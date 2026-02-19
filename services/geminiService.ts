
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `Bạn là Chuyên gia Mixing & Mastering cấp cao tại các Studio hàng đầu thế giới. Nhiệm vụ của bạn là bóc tách Audio và tái lập lại chuỗi Signal Chain chuyên nghiệp nhất để Vocal đạt chất lượng như ca sĩ hạng A.

# 1. PHÂN TÍCH CHUYÊN SÂU (VOCAL RECONNAISSANCE):
- Texture Diagnosis: Chẩn đoán chi tiết các dải tần bị lỗi (Muddy ở 300Hz, Harsh ở 3kHz, v.v.)
- Artist Strategy: Đề xuất hướng xử lý để giọng "đắt tiền" và "sang trọng".

# 2. CHUỖI 8 BƯỚC MIXING RACK (YÊU CẦU 3D SVG):
Mỗi bước phải cung cấp:
- visual_demo_svg: Mã SVG mô phỏng 3D (dùng gradients và shadows) của Plugin thật. Phải thấy được chiều sâu của các núm vặn và mặt máy hardware.
- mixing_mindset: Tư duy kỹ thuật sâu (Tại sao lại dùng bước này cho giọng của người dùng).
- knob_instruction: Thông số chính xác để người dùng copy vào phần mềm.
- studio_secret: "Mẹo nhà nghề" để Vocal nghe chuyên nghiệp và cảm xúc hơn (Ví dụ: cách dùng hơi thở, cách kiểm soát sibilance).

# 3. DANH SÁCH PLUGIN CHUẨN PHÒNG THU:
1. Antares Auto-Tune Pro (Cân chỉnh cao độ tự nhiên)
2. FabFilter Pro-Q 3 (Phẫu thuật tần số)
3. UAD 1176LN (Kiểm soát dynamic mạnh mẽ)
4. Teletronix LA-2A (Làm mượt và dày giọng)
5. FabFilter Pro-DS (Khử xì cao cấp)
6. Soundtoys Decapitator (Hài âm Analog ấm áp)
7. H-Delay (Tạo không gian 3D)
8. Valhalla Vintage Verb (Tạo chiều sâu sân khấu)

# 4. QUY TẮC KỸ THUẬT JSON:
- SVG phải tối ưu (dùng rect/circle/simple paths) để không làm quá tải JSON.
- Đảm bảo JSON luôn hoàn chỉnh (không bị Unterminated).
- Ngôn ngữ: Tiếng Việt chuyên môn cao.`;

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
  
  const prompt = `Analyze this vocal source. Generate a professional 8-step studio rack with 3D-style SVG visualizations. Provide deep technical mindset and "Studio Secrets" for each unit to help the user achieve world-class vocal quality. Focus on surgical precision and musical warmth.`;

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.3, // Lower temp for more consistent technical JSON
      maxOutputTokens: 8192
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text.trim()) as AnalysisReport;
  } catch (error) {
    console.error("JSON Analysis Error:", error);
    throw error;
  }
}
