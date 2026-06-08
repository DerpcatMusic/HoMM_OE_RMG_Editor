using System.Collections.Generic;
using Hex.UI;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhEditorItemsListView : BhScreenElement
	{
		[Space]
		[Space]
		[Space]
		[SerializeField]
		private BhEditorListItem pref;

		[SerializeField]
		private EEditorTypes eEditorTypes;

		[SerializeField]
		private Transform parent;

		[SerializeField]
		private Transform altParent;

		[SerializeField]
		private BhEditorListFilters filters;

		private yf bupc;

		private BhEditorListItem bupd;

		private List<GameObject> bupe;

		private Dictionary<string, GameObject> bupf;

		private Dictionary<string, GameObject> bupg;

		private int buph;

		private string bupi;

		private string bupj;

		private bool bupk;

		public void Show(ESubButtonType _subButtonType = ESubButtonType.Main)
		{
		}

		public void Show(string _subTag, ESubButtonType _subButtonType = ESubButtonType.Main)
		{
		}

		public void noy(BhEditorListItem a)
		{
		}

		public void noz()
		{
		}

		public void SetUp(string _tag = "", ESubButtonType _subButtonType = ESubButtonType.Main)
		{
		}
	}
}
