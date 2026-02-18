
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `Bạn là Chuyên gia Mixing chuyên nghiệp (Senior Mixing Engineer). Khi phân tích Vocal, bạn phải cung cấp hướng dẫn bằng hình ảnh thực tế (Visual Demo) và thao tác núm vặn (Knobs) cho một chuỗi Signal Chain toàn diện gồm 8 bước.

Nhiệm vụ của bạn là bóc tách Audio và xuất dữ liệu kỹ thuật cực kỳ chi tiết theo cấu trúc 8 bước Signal Chain:

# 1. PHÂN TÍCH CHUYÊN SÂU (VOCAL TEXTURE):
- Bắt bệnh: Xác định giọng bị "Boxy", "Harsh", "Thin" hay "Muddy". 
- Gợi ý phong cách: Mix theo kiểu Modern Pop, Vintage Soul, v.v.

# 2. CHI TIẾT 8 BƯỚC PLUGIN (BẮT BUỘC THEO THỨ TỰ):
1. **Antares Auto-Tune Pro**: (Pitch Correction) Vẽ giao diện tối, vòng tròn Retune Speed xanh Cyan.
2. **FabFilter Pro-Q 3**: (Subtractive EQ) Vẽ biểu đồ EQ hiện đại, nền lưới xanh đậm, đường cong có shadow.
3. **UAD 1176LN**: (Fast Compression) Mặt sắt đen cổ điển, kim VU nhảy mạnh để kiểm soát transient.
4. **Waves CLA-2A**: (Tonal Smoothing) Mặt máy xám bạc, 2 núm lớn, đồng hồ tròn làm dày vocal.
5. **FabFilter Pro-DS**: (De-Esser) Giao diện tinh giản, thanh Gain Reduction tím dìm dải xì.
6. **Soundtoys Decapitator**: (Saturation) Mặt máy Vintage vàng đồng/xám, biểu đồ nhiệt đỏ tạo độ ấm Tube/Tape.
7. **Delay (Gợi ý: Waves H-Delay hoặc ValhallaDelay)**: Vẽ giao diện đặc trưng (H-Delay có núm xoay lớn phong cách Analog, Valhalla có màu sắc rực rỡ). Giải thích cách tạo độ rộng không gian.
8. **Reverb (Gợi ý: ValhallaVintageVerb, FabFilter Pro-R hoặc Lexicon PCM)**: Vẽ giao diện huyền thoại (Valhalla có bảng điều khiển digital cổ điển, Pro-R có biểu đồ không gian 3D xanh lá/cyan). Giải thích cách tạo chiều sâu (Depth).

# 3. YÊU CẦU CẤU TRÚC CHO MỖI PLUGIN (TechnicalStep):
- **ui_description**: [Mô tả thực tế] Mô tả giao diện thực tế của Plugin (Màu sắc, nút bấm, đèn LED, kim đồng hồ).
- **mixing_mindset**: [Cách chỉnh để Vocal hay hơn] Giải thích tư duy Mixing chuyên nghiệp. Tại sao bước này quan trọng đối với Vocal này?
- **knob_instruction**: [Thông số Knobs] Vị trí chính xác của từng nút vặn quan trọng nhất (Vị trí kim đồng hồ hoặc giá trị số).
- **visual_demo_svg**: Mã SVG mô phỏng Photorealistic UI của plugin đó (Cần độ chi tiết cao, màu sắc trung thực với bản gốc).

# 4. THÔNG SỐ NÚT VẶN TỔNG QUAN (visual_data):
- Cung cấp dữ liệu cho các nút vặn Compressor chính để App vẽ biểu đồ Knob trung tâm.

Ngôn ngữ: Tiếng Việt. SVG phải trông như giao diện phần mềm thật, chuyên nghiệp và thẩm mỹ cao.`;

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
    ? `Analyze audio link: ${input.link}. Generate an 8-step high-fidelity plugin chain including advanced Space effects (Delay & Reverb from Waves, Valhalla, or FabFilter). Provide professional mixing mindset for each.`
    : `Analyze audio file. Generate an 8-step high-fidelity plugin chain including advanced Space effects (Delay & Reverb from Waves, Valhalla, or FabFilter). Provide professional mixing mindset for each.`;

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.1
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text) as AnalysisReport;
  } catch (error) {
    console.error("Parse error:", error);
    throw error;
  }
}
