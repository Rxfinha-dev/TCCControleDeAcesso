namespace TCCControleDeAcesso.Views
{
    partial class frmTrocandoSenha
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.txtNovaSenha = new System.Windows.Forms.TextBox();
            this.label2 = new System.Windows.Forms.Label();
            this.txtNovaSenha2 = new System.Windows.Forms.TextBox();
            this.label3 = new System.Windows.Forms.Label();
            this.btnAlterarSenha = new System.Windows.Forms.Button();
            this.chkBoxMostrarSenha = new System.Windows.Forms.CheckBox();
            this.SuspendLayout();
            // 
            // txtNovaSenha
            // 
            this.txtNovaSenha.Location = new System.Drawing.Point(994, 522);
            this.txtNovaSenha.Name = "txtNovaSenha";
            this.txtNovaSenha.Size = new System.Drawing.Size(209, 20);
            this.txtNovaSenha.TabIndex = 3;
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label2.Location = new System.Drawing.Point(795, 521);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(94, 18);
            this.label2.TabIndex = 2;
            this.label2.Text = "Nova senha:";
            // 
            // txtNovaSenha2
            // 
            this.txtNovaSenha2.Location = new System.Drawing.Point(994, 569);
            this.txtNovaSenha2.Name = "txtNovaSenha2";
            this.txtNovaSenha2.Size = new System.Drawing.Size(209, 20);
            this.txtNovaSenha2.TabIndex = 5;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label3.Location = new System.Drawing.Point(796, 570);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(192, 18);
            this.label3.TabIndex = 4;
            this.label3.Text = "Repetir a sua nova senha: ";
            // 
            // btnAlterarSenha
            // 
            this.btnAlterarSenha.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnAlterarSenha.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnAlterarSenha.Font = new System.Drawing.Font("Arial", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAlterarSenha.Location = new System.Drawing.Point(994, 603);
            this.btnAlterarSenha.Name = "btnAlterarSenha";
            this.btnAlterarSenha.Size = new System.Drawing.Size(108, 48);
            this.btnAlterarSenha.TabIndex = 6;
            this.btnAlterarSenha.Text = "Alterar Senha";
            this.btnAlterarSenha.UseVisualStyleBackColor = false;
            this.btnAlterarSenha.Click += new System.EventHandler(this.btnAlterarSenha_Click);
            // 
            // chkBoxMostrarSenha
            // 
            this.chkBoxMostrarSenha.AutoSize = true;
            this.chkBoxMostrarSenha.Font = new System.Drawing.Font("Arial Narrow", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.chkBoxMostrarSenha.Location = new System.Drawing.Point(879, 615);
            this.chkBoxMostrarSenha.Name = "chkBoxMostrarSenha";
            this.chkBoxMostrarSenha.Size = new System.Drawing.Size(107, 24);
            this.chkBoxMostrarSenha.TabIndex = 7;
            this.chkBoxMostrarSenha.Text = "Mostrar senha";
            this.chkBoxMostrarSenha.UseVisualStyleBackColor = true;
            this.chkBoxMostrarSenha.CheckedChanged += new System.EventHandler(this.chkBoxMostrarSenha_CheckedChanged);
            // 
            // frmTrocandoSenha
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 14F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.BackgroundImage = global::TCCControleDeAcesso.Properties.Resources.Design_sem_nome__7_;
            this.ClientSize = new System.Drawing.Size(1853, 933);
            this.Controls.Add(this.chkBoxMostrarSenha);
            this.Controls.Add(this.btnAlterarSenha);
            this.Controls.Add(this.txtNovaSenha2);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.txtNovaSenha);
            this.Controls.Add(this.label2);
            this.Font = new System.Drawing.Font("Arial", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.Name = "frmTrocandoSenha";
            this.Text = "frmTrocandoSenha";
            this.Load += new System.EventHandler(this.frmTrocandoSenha_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion
        private System.Windows.Forms.TextBox txtNovaSenha;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox txtNovaSenha2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Button btnAlterarSenha;
        private System.Windows.Forms.CheckBox chkBoxMostrarSenha;
        private Guna.UI2.WinForms.Guna2AnimateWindow guna2AnimateWindow1;
    }
}