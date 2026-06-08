using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public static class DebugGUI
{
	public interface ITextBoxLine
	{
		float GetWidth();

		float GetHeight();

		void Draw(Rect rect);
	}

	public class SloidLine : ITextBoxLine
	{
		private Color color;

		public SloidLine(Color color)
		{
			this.color = color;
		}

		public void Draw(Rect rect)
		{
			rect.height = GetHeight();
			GUI.DrawTexture(rect, GetColoredTexture(color));
		}

		public float GetHeight()
		{
			return 2f;
		}

		public float GetWidth()
		{
			return 1f;
		}
	}

	public class TextLine : ITextBoxLine
	{
		private StyledContent content;

		public TextLine(string text, GUIStyle style = null)
		{
			content = new StyledContent(text, style);
		}

		public void UpdateContent(string text, GUIStyle style = null)
		{
			if (style != null)
			{
				content = new StyledContent(text, style);
			}
			else
			{
				content = new StyledContent(text, content.style);
			}
		}

		public void Draw(Rect rect)
		{
			rect.width = content.size.x;
			rect.height = content.size.y;
			GUI.Label(rect, content.content, content.style);
		}

		public float GetHeight()
		{
			return content.size.y;
		}

		public float GetWidth()
		{
			return content.size.x;
		}
	}

	public class Table : ITextBoxLine
	{
		private List<StyledContent> content = new List<StyledContent>();

		private float spacingRow;

		private float spacingColumn;

		private Vector2 size;

		private List<float> rowHeights = new List<float>();

		private List<float> columnWidths = new List<float>();

		private int columnCount = 1;

		private int rowCount;

		private bool isSizeDirty = true;

		public float GetWidth()
		{
			CalcSize();
			return size.x;
		}

		public float GetHeight()
		{
			CalcSize();
			return size.y;
		}

		public void Draw(Rect rect)
		{
			CalcSize();
			Rect position = rect;
			for (int i = 0; i < rowCount; i++)
			{
				for (int j = 0; j < columnCount; j++)
				{
					int num = j + i * columnCount;
					if (num >= content.Count)
					{
						break;
					}
					StyledContent styledContent = content[num];
					position.width = styledContent.size.x;
					position.height = styledContent.size.y;
					GUI.Label(position, styledContent.content, styledContent.style);
					position.x += columnWidths[j] + spacingColumn;
				}
				position.y += rowHeights[i] + spacingRow;
				position.x = rect.x;
			}
		}

		public void Clear()
		{
			content.Clear();
			isSizeDirty = true;
		}

		public void SetColumnCount(int columnCount)
		{
			this.columnCount = columnCount;
			isSizeDirty = true;
		}

		public void SetSpacing(float column, float row)
		{
			spacingRow = row;
			spacingColumn = column;
		}

		public void AddElement(string text, GUIStyle style = null)
		{
			content.Add(new StyledContent(text, style));
			isSizeDirty = true;
		}

		private void CalcSize()
		{
			if (!isSizeDirty)
			{
				return;
			}
			columnWidths.Clear();
			rowHeights.Clear();
			isSizeDirty = false;
			size = Vector2.zero;
			rowCount = content.Count / columnCount;
			if (content.Count % columnCount != 0)
			{
				rowCount++;
			}
			for (int i = 0; i < columnCount; i++)
			{
				float num = 0f;
				for (int j = 0; j < rowCount; j++)
				{
					num = Mathf.Max(num, content[j * columnCount + i].size.x);
				}
				columnWidths.Add(num);
				size.x += num;
			}
			for (int k = 0; k < rowCount; k++)
			{
				float num2 = 0f;
				for (int l = 0; l < columnCount; l++)
				{
					num2 = Mathf.Max(num2, content[k * columnCount + l].size.y);
				}
				rowHeights.Add(num2);
				size.y += num2;
			}
			size.x += (float)(columnCount - 1) * spacingColumn;
			size.y += (float)(rowCount - 1) * spacingRow;
		}
	}

	public struct StyledContent
	{
		public readonly GUIContent content;

		public readonly GUIStyle style;

		public readonly Vector2 size;

		public StyledContent(string text, GUIStyle style = null)
		{
			content = new GUIContent(text);
			this.style = ((style == null) ? GUI.skin.label : style);
			size = this.style.CalcSize(content);
		}
	}

	private static Texture2D darkTexture;

	private static Texture2D colorTexture;

	private static Texture2D DarkTexture
	{
		get
		{
			if (darkTexture == null)
			{
				darkTexture = new Texture2D(1, 1);
				darkTexture.SetPixel(0, 0, new Color(0.1f, 0.1f, 0.1f, 1f));
				darkTexture.Apply();
			}
			return darkTexture;
		}
	}

	public static void DrawTextBox(Vector2 screenPosition, List<ITextBoxLine> lines)
	{
		int count = lines.Count;
		float num = 0f;
		for (int i = 0; i < count; i++)
		{
			num += lines[i].GetHeight();
			if (i < count - 1)
			{
				num += 7f;
			}
		}
		float num2 = 0f;
		foreach (ITextBoxLine line in lines)
		{
			num2 = Mathf.Max(num2, line.GetWidth());
		}
		screenPosition.y += num;
		screenPosition.y = (float)Screen.height - screenPosition.y;
		Rect position = new Rect(screenPosition, new Vector2(num2 + 20f, num));
		GUI.DrawTexture(position, DarkTexture);
		position = new Rect(screenPosition + Vector2.right * 10f, new Vector2(num2, 0f));
		foreach (ITextBoxLine line2 in lines)
		{
			position.height = line2.GetHeight();
			line2.Draw(position);
			position.position += Vector2.up * (line2.GetHeight() + 7f);
		}
	}

	public static Texture2D GetColoredTexture(Color color)
	{
		if (colorTexture == null)
		{
			colorTexture = new Texture2D(1, 1);
		}
		colorTexture.SetPixel(0, 0, color);
		colorTexture.Apply();
		return colorTexture;
	}
}
