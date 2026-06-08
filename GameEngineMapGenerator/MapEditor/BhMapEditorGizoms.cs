using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhMapEditorGizoms : MonoBehaviour
	{
		[SerializeField]
		private CanvasGroup cg;

		[SerializeField]
		private Toggle grid;

		[SerializeField]
		private Toggle lines;

		[SerializeField]
		private TMP_InputField inputVert;

		[SerializeField]
		private TMP_InputField inputHorizontal;

		public void OnChangeInput()
		{
		}

		public void Show()
		{
		}

		public void Hide()
		{
		}
	}
}
