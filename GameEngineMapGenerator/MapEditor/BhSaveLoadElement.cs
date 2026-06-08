using System;
using System.Runtime.CompilerServices;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;

namespace Hex.MapEditor
{
	public class BhSaveLoadElement : BhFilesElement
	{
		[SerializeField]
		private TextMeshProUGUI title;

		[SerializeField]
		private TextMeshProUGUI description;

		[SerializeField]
		private GameObject extractButton;

		private BhSaveLoad.EMode bujq;

		private string bujt;

		private event Action<string, BhSaveLoad.EMode, BhSaveLoadElement, bool> bujr
		{
			[CompilerGenerated]
			add
			{
			}
			[CompilerGenerated]
			remove
			{
			}
		}

		private event Action<string> bujs
		{
			[CompilerGenerated]
			add
			{
			}
			[CompilerGenerated]
			remove
			{
			}
		}

		public void Init(pv _file, Action<string, BhSaveLoad.EMode, BhSaveLoadElement, bool> onClick, Action<string> _onExtract)
		{
		}

		public void nii(BhSaveLoad.EMode a)
		{
		}

		public override void OnPointerClick(PointerEventData eventData)
		{
		}

		public override void nff()
		{
		}

		public void OnDelete()
		{
		}

		public void OnExtract()
		{
		}
	}
}
