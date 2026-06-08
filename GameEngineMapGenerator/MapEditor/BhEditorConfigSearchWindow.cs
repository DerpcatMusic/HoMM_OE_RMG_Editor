using System.Collections.Generic;
using Hex.UI;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhEditorConfigSearchWindow : BhScreenElement
	{
		[SerializeField]
		private BhEditorListItem pref;

		[SerializeField]
		private Transform parent;

		[SerializeField]
		private TMP_InputField inputField;

		private bool bupa;

		private List<GameObject> bupb;

		public override void Show()
		{
		}

		public void SetUp()
		{
		}
	}
}
